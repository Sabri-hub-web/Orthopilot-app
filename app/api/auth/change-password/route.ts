import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { requireApiUser } from "@/lib/auth/api-guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";
import { prisma } from "@/server/db/client";
import { writeActivityLog } from "@/server/activity-log";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Nouveau mot de passe : au moins 8 caractères."),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response || !auth.user) return auth.response;

    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;
    const payload = schema.parse(raw);

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { passwordHash: true },
    });
    if (!user) {
      return NextResponse.json({ message: "Utilisateur introuvable." }, { status: 404 });
    }

    const valid = await verifyPassword(payload.currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ message: "Mot de passe actuel incorrect." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: auth.user.id },
      data: { passwordHash: await hashPassword(payload.newPassword) },
    });

    await writeActivityLog({
      actor: auth.user.fullName,
      message: `Changement mot de passe: ${auth.user.email}`,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    console.error("POST /api/auth/change-password failed", error);
    return NextResponse.json({ message: "Impossible de changer le mot de passe." }, { status: 500 });
  }
}
