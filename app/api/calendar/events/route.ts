import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { createCalendarEvent } from "@/services/calendar-service";
import { calendarEventCreateSchema } from "@/lib/validation/calendar";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "calendar:manage");
    if (auth.response || !auth.user) return auth.response;

    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;

    const payload = calendarEventCreateSchema.parse(raw);
    const item = await createCalendarEvent(
      {
        title: payload.title,
        description: payload.description ?? null,
        startAt: payload.startAt,
        endAt: payload.endAt,
        type: payload.type,
        patientId: payload.patientId ?? null,
        assigneeId: payload.assigneeId ?? null,
      },
      auth.user.id,
      auth.user.fullName ?? auth.user.email,
    );

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    console.error("POST /api/calendar/events failed", error);
    return NextResponse.json({ message: "Impossible de creer l evenement." }, { status: 500 });
  }
}
