import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { requireApiPermission, requireApiUser } from "@/lib/auth/api-guard";
import { hashPassword } from "@/lib/auth/password";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";
import { prisma } from "@/server/db/client";
import { writeActivityLog } from "@/server/activity-log";

const userCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  role: z.enum(["RESPONSABLE", "SECRETAIRE", "PRATICIEN", "ASSISTANTE"]),
  password: z.string().min(8),
});

function canManageUsers(role: string): boolean {
  return role === "ADMIN" || role === "RESPONSABLE";
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "users:view");
    if (auth.response) return auth.response;
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        presenceStatus: true,
        createdAt: true,
      },
      orderBy: { fullName: "asc" },
    });
    return NextResponse.json(
      {
        items: users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/users failed", error);
    return NextResponse.json({ message: "Impossible de charger les utilisateurs." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response || !auth.user) return auth.response;
    if (!canManageUsers(auth.user.role)) {
      return NextResponse.json({ message: "Accès non autorisé pour votre rôle." }, { status: 403 });
    }

    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;
    const payload = userCreateSchema.parse(raw);

    const created = await prisma.user.create({
      data: {
        fullName: payload.fullName,
        email: payload.email.toLowerCase(),
        role: payload.role,
        passwordHash: await hashPassword(payload.password),
      },
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
      message: `Création utilisateur: ${created.fullName}`,
    });

    return NextResponse.json({ ...created, createdAt: created.createdAt.toISOString() }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return validationErrorResponse(error);
    console.error("POST /api/users failed", error);
    return NextResponse.json({ message: "Impossible de créer l'utilisateur." }, { status: 500 });
  }
}
