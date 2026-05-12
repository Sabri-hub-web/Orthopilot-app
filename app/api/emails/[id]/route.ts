import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { deleteEmail, updateEmail } from "@/services/emails-service";
import { emailUpdateSchema } from "@/lib/validation/emails";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";
import type { EmailFormPayload } from "@/types/domain";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request, "emails:manage");
    if (auth.response) return auth.response;
    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;

    const payload = emailUpdateSchema.parse(raw);
    const { id } = await params;
    const item = await updateEmail(id, payload as Partial<EmailFormPayload>);

    if (!item) {
      return NextResponse.json({ message: "Email introuvable." }, { status: 404 });
    }

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("PATCH /api/emails/:id failed", error);
    return NextResponse.json({ message: "Impossible de modifier l'email." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request, "emails:manage");
    if (auth.response) return auth.response;
    const { id } = await params;
    const result = await deleteEmail(id);
    if (!result) {
      return NextResponse.json({ message: "Email introuvable." }, { status: 404 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/emails/:id failed", error);
    return NextResponse.json({ message: "Impossible de supprimer l'email." }, { status: 500 });
  }
}
