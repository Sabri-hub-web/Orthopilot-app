import { NextRequest, NextResponse } from "next/server";
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
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("POST /api/auth/logout failed", error);
    return NextResponse.json({ message: "Impossible de se deconnecter." }, { status: 500 });
  }
}
