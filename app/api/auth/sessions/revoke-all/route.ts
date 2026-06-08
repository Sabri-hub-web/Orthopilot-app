import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { requireApiUser } from "@/lib/auth/api-guard";
import { prisma } from "@/server/db/client";
import { writeActivityLog } from "@/server/activity-log";
import crypto from "node:crypto";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response || !auth.user) return auth.response;

    const currentToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const currentHash = currentToken ? sha256(currentToken) : null;

    await prisma.session.deleteMany({
      where: {
        userId: auth.user.id,
        ...(currentHash ? { tokenHash: { not: currentHash } } : {}),
      },
    });

    await writeActivityLog({
      actor: auth.user.fullName,
      message: `Déconnexion de tous les appareils: ${auth.user.email}`,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("POST /api/auth/sessions/revoke-all failed", error);
    return NextResponse.json({ message: "Impossible de révoquer les sessions." }, { status: 500 });
  }
}
