import { NextRequest, NextResponse } from "next/server";
import { hasPermission, type AppPermission } from "@/lib/auth/permissions";
import { getApiUser } from "@/lib/auth/session";

export async function requireApiUser(request: NextRequest) {
  const user = await getApiUser(request);
  if (!user) {
    return {
      response: NextResponse.json({ message: "Authentification requise." }, { status: 401 }),
      user: null,
    };
  }
  return { response: null, user };
}

export async function requireApiPermission(request: NextRequest, permission: AppPermission) {
  const auth = await requireApiUser(request);
  if (auth.response || !auth.user) return auth;
  if (!hasPermission(auth.user.role, permission)) {
    return {
      response: NextResponse.json({ message: "Acces non autorise pour votre role." }, { status: 403 }),
      user: null,
    };
  }
  return auth;
}
