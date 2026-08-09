import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { requireApiUser } from "@/lib/auth/api-guard";
import { hashPassword } from "@/lib/auth/password";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";
import { prisma } from "@/server/db/client";
import { writeActivityLog } from "@/server/activity-log";

const schema = z.object({
  password: z.string().min(8, "Mot de passe : au moins 8 caractères."),
});

function canManageUsers(_role: string): boolean {
  return true;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response || !auth.user) return auth.response;
    if (!canManageUsers(auth.user.role)) {
      return NextResponse.json({ message: "Accès non autorisé pour votre rôle." }, { status: 403 });
    }

    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;
    const payload = schema.parse(raw);
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id }, select: { fullName: true } });
    if (!user) {
      return NextResponse.json({ message: "Utilisateur introuvable." }, { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: { passwordHash: await hashPassword(payload.password) },
    });

    await prisma.session.deleteMany({ where: { userId: id } });

    await writeActivityLog({
      actor: auth.user.fullName,
      message: `Réinitialisation mot de passe: ${user.fullName}`,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    console.error("POST /api/users/:id/reset-password failed", error);
    return NextResponse.json({ message: "Impossible de réinitialiser le mot de passe." }, { status: 500 });
  }
}
