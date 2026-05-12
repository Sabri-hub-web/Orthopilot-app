import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { getCalendarFeed } from "@/services/calendar-service";
import { calendarFeedQuerySchema } from "@/lib/validation/calendar";
import { validationErrorResponse } from "@/lib/validation/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "calendar:view");
    if (auth.response || !auth.user) return auth.response;

    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = calendarFeedQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const from = new Date(parsed.data.from);
    const to = new Date(parsed.data.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
      return NextResponse.json({ message: "Periode invalide (from / to)." }, { status: 400 });
    }

    const data = await getCalendarFeed(from, to);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET /api/calendar/feed failed", error);
    return NextResponse.json({ message: "Impossible de charger le calendrier." }, { status: 500 });
  }
}
