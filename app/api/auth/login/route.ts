import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionForUser } from "@/lib/auth/session";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";
import { writeActivityLog } from "@/server/activity-log";
import { prisma } from "@/server/db/client";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email requis."),
  password: z.string().min(1, "Mot de passe requis."),
});

export async function POST(request: NextRequest) {
  try {
    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;
    const payload = loginSchema.parse(raw);

    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
      select: { id: true, fullName: true, email: true, role: true, passwordHash: true },
    });

    if (!user) {
      await writeActivityLog({
        actor: "Authentification",
        message: `Echec connexion: utilisateur inconnu (${payload.email})`,
      });
      return NextResponse.json({ message: "Identifiants invalides." }, { status: 401 });
    }

    const valid = await verifyPassword(payload.password, user.passwordHash);
    if (!valid) {
      await writeActivityLog({
        actor: "Authentification",
        message: `Echec connexion: mot de passe invalide (${user.email})`,
      });
      return NextResponse.json({ message: "Identifiants invalides." }, { status: 401 });
    }

    const { token, expiresAt } = await createSessionForUser(user.id);
    await writeActivityLog({
      actor: user.fullName,
      message: `Connexion: ${user.email}`,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 },
    );

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error);
    }
    console.error("POST /api/auth/login failed", error);
    return NextResponse.json({ message: "Impossible de se connecter." }, { status: 500 });
  }
}
