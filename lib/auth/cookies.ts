import { AUTH_COOKIE_NAME, SESSION_TTL_DAYS } from "@/lib/auth/constants";

/** Options cookies session OrthoPilot (Vercel HTTPS + same-origin). */
export function getAuthCookieOptions(expires: Date) {
  const secure =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure,
    path: "/",
    expires,
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  };
}

export function getClearedAuthCookieOptions() {
  return {
    ...getAuthCookieOptions(new Date(0)),
    value: "",
    maxAge: 0,
  };
}
