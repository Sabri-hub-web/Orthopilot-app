import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getNotificationsForUser } from "@/services/notifications-service";

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response || !auth.user) return auth.response;

    const limit = parsePositiveInt(request.nextUrl.searchParams.get("limit"), 20);
    const data = await getNotificationsForUser(auth.user.id, limit);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET /api/notifications failed", error);
    return NextResponse.json({ message: "Impossible de charger les notifications." }, { status: 500 });
  }
}
