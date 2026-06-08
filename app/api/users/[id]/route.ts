import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { requireApiUser } from "@/lib/auth/api-guard";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";
import { prisma } from "@/server/db/client";
import { writeActivityLog } from "@/server/activity-log";

const userUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    role: z.enum(["ADMIN", "RESPONSABLE", "SECRETAIRE", "PRATICIEN", "ASSISTANTE"]).optional(),
    presenceStatus: z.enum(["DISPONIBLE", "EN_CONSULTATION", "EN_REUNION", "ABSENT"]).optional(),
  })
  .refine((p) => Object.keys(p).length > 0, { message: "Aucune donnée à modifier." });

function canManageUsers(role: string): boolean {
  return role === "ADMIN" || role === "RESPONSABLE";
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response || !auth.user) return auth.response;
    if (!canManageUsers(auth.user.role)) {
      return NextResponse.json({ message: "Accès non autorisé pour votre rôle." }, { status: 403 });
    }

    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;
    const payload = userUpdateSchema.parse(raw);
    const { id } = await params;

    const updated = await prisma.user.update({
      where: { id },
      data: payload,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        presenceStatus: true,
        createdAt: true,
      },
    });

    await writeActivityLog({
      actor: auth.user.fullName,
      message: `Modification utilisateur: ${updated.fullName}`,
    });

    return NextResponse.json({ ...updated, createdAt: updated.createdAt.toISOString() }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    console.error("PATCH /api/users/:id failed", error);
    return NextResponse.json({ message: "Impossible de modifier l'utilisateur." }, { status: 500 });
  }
}
