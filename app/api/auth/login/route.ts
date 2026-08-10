import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { z } from "zod";
import { getAuthCookieOptions } from "@/lib/auth/cookies";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionForUser } from "@/lib/auth/session";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";
import { writeActivityLog } from "@/server/activity-log";
import { prisma } from "@/server/db/client";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email requis.")
    .max(200)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Mot de passe requis."),
});

function authError(message: string, status: number) {
  return NextResponse.json({ error: message, message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;

    const payload = loginSchema.parse(raw);
    console.info("[auth/login] Tentative de connexion", {
      email: payload.email,
      host: request.headers.get("host"),
      origin: request.headers.get("origin"),
    });

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      select: { id: true, fullName: true, email: true, role: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      console.warn("[auth/login] Utilisateur introuvable ou sans mot de passe", {
        email: payload.email,
      });
      await writeActivityLog({
        actor: "Authentification",
        message: `Echec connexion: utilisateur inconnu (${payload.email})`,
      });
      return authError("Identifiants invalides.", 401);
    }

    const valid = await verifyPassword(payload.password, user.passwordHash);
    if (!valid) {
      console.warn("[auth/login] Mot de passe invalide", { email: user.email });
      await writeActivityLog({
        actor: "Authentification",
        message: `Echec connexion: mot de passe invalide (${user.email})`,
      });
      return authError("Identifiants invalides.", 401);
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
      ...getAuthCookieOptions(expiresAt),
      value: token,
    });

    console.info("[auth/login] Connexion OK", {
      userId: user.id,
      email: user.email,
      secureCookie: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("Erreur création session / login:", error);
    return authError("Impossible de se connecter. Réessayez dans un instant.", 500);
  }
}
