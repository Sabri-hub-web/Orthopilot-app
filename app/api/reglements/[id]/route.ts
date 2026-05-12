import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { deleteReglement, updateReglement } from "@/services/reglements-service";
import { reglementUpdateSchema } from "@/lib/validation/reglements";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";
import type { ReglementFormPayload } from "@/types/domain";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request, "reglements:manage");
    if (auth.response) return auth.response;
    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;

    const payload = reglementUpdateSchema.parse(raw);
    const { id } = await params;
    const item = await updateReglement(id, payload as Partial<ReglementFormPayload>);

    if (!item) {
      return NextResponse.json({ message: "Reglement introuvable." }, { status: 404 });
    }

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("PATCH /api/reglements/:id failed", error);
    return NextResponse.json({ message: "Impossible de modifier le reglement." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request, "reglements:manage");
    if (auth.response) return auth.response;
    const { id } = await params;
    const result = await deleteReglement(id);
    if (!result) {
      return NextResponse.json({ message: "Reglement introuvable." }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/reglements/:id failed", error);
    return NextResponse.json({ message: "Impossible de supprimer le reglement." }, { status: 500 });
  }
}
