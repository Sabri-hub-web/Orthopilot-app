import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { assignEmail } from "@/services/emails-service";
import { parseJsonBody } from "@/lib/validation/http";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request, "emails:manage");
    if (auth.response) return auth.response;

    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;

    const assigneeIdRaw = (raw as { assigneeId?: unknown }).assigneeId;
    if (assigneeIdRaw !== null && typeof assigneeIdRaw !== "string") {
      return NextResponse.json({ message: "assigneeId invalide." }, { status: 400 });
    }
    const assigneeId = assigneeIdRaw === "" ? null : (assigneeIdRaw ?? null);

    const { id } = await params;
    const item = await assignEmail(id, assigneeId);
    if (!item) {
      return NextResponse.json({ message: "Email introuvable." }, { status: 404 });
    }

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/emails/:id/assign failed", error);
    return NextResponse.json({ message: "Impossible d'assigner l'email." }, { status: 500 });
  }
}
