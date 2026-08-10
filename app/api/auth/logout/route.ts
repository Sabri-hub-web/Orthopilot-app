import { NextRequest, NextResponse } from "next/server";
import { getClearedAuthCookieOptions } from "@/lib/auth/cookies";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";
import { getApiUser, invalidateSessionToken } from "@/lib/auth/session";
import { writeActivityLog } from "@/server/activity-log";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const user = await getApiUser(request);

    if (token) {
      await invalidateSessionToken(token);
    }

    if (user) {
      await writeActivityLog({
        actor: user.fullName,
        message: `Deconnexion: ${user.email}`,
      });
    }

    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set(getClearedAuthCookieOptions());
    return response;
  } catch (error) {
    console.error("POST /api/auth/logout failed", error);
    return NextResponse.json(
      { error: "Impossible de se deconnecter.", message: "Impossible de se deconnecter." },
      { status: 500 },
    );
  }
}
