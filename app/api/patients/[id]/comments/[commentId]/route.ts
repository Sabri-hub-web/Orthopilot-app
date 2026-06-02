import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { parseJsonBody } from "@/lib/validation/http";
import { updatePatientCommentStatus } from "@/services/patients-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const auth = await requireApiPermission(request, "patients:comment");
    if (auth.response) return auth.response;
    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;
    const isDone = Boolean((raw as { isDone?: unknown }).isDone);
    const { id, commentId } = await params;
    const updated = await updatePatientCommentStatus(id, commentId, isDone, {
      fullName: auth.user.fullName,
    });
    if (!updated) return NextResponse.json({ message: "Commentaire introuvable." }, { status: 404 });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/patients/:id/comments/:commentId failed", error);
    return NextResponse.json({ message: "Impossible de modifier le commentaire." }, { status: 500 });
  }
}
