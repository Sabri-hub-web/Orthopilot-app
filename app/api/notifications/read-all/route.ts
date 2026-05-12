import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { markAllNotificationsAsRead } from "@/services/notifications-service";

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response || !auth.user) return auth.response;

    const result = await markAllNotificationsAsRead(auth.user.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/notifications/read-all failed", error);
    return NextResponse.json({ message: "Impossible de marquer toutes les notifications." }, { status: 500 });
  }
}
