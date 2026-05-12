import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { deleteCalendarEvent, updateCalendarEvent } from "@/services/calendar-service";
import { calendarEventUpdateSchema } from "@/lib/validation/calendar";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request, "calendar:manage");
    if (auth.response || !auth.user) return auth.response;

    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;

    const payload = calendarEventUpdateSchema.parse(raw);
    const { id } = await params;

    try {
      const item = await updateCalendarEvent(id, payload, auth.user.fullName ?? auth.user.email);
      if (!item) {
        return NextResponse.json({ message: "Evenement introuvable." }, { status: 404 });
      }
      return NextResponse.json(item, { status: 200 });
    } catch (e) {
      if (e instanceof Error && e.message === "INVALID_RANGE") {
        return NextResponse.json({ message: "La fin doit etre apres le debut." }, { status: 400 });
      }
      throw e;
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    console.error("PATCH /api/calendar/events/:id failed", error);
    return NextResponse.json({ message: "Impossible de modifier l evenement." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request, "calendar:manage");
    if (auth.response || !auth.user) return auth.response;

    const { id } = await params;
    const result = await deleteCalendarEvent(id, auth.user.fullName ?? auth.user.email);
    if (!result) {
      return NextResponse.json({ message: "Evenement introuvable." }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/calendar/events/:id failed", error);
    return NextResponse.json({ message: "Impossible de supprimer l evenement." }, { status: 500 });
  }
}
