import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { markNotificationAsRead } from "@/services/notifications-service";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response || !auth.user) return auth.response;

    const { id } = await params;
    const result = await markNotificationAsRead(auth.user.id, id);
    if (!result.ok) {
      return NextResponse.json({ message: "Notification introuvable." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, alreadyRead: result.alreadyRead }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/notifications/:id/read failed", error);
    return NextResponse.json({ message: "Impossible de marquer la notification comme lue." }, { status: 500 });
  }
}
