import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { hasPermission } from "@/lib/auth/permissions";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getPatientHub, updatePatient } from "@/services/patients-service";
import { patientUpdateSchema } from "@/lib/validation/patients";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";
import type { PatientFormPayload } from "@/types/domain";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response) return auth.response;
    const { id } = await params;
    const hub = await getPatientHub(id);
    if (!hub) {
      return NextResponse.json({ message: "Patient introuvable." }, { status: 404 });
    }
    return NextResponse.json(hub, { status: 200 });
  } catch (error) {
    console.error("GET /api/patients/:id failed", error);
    return NextResponse.json({ message: "Impossible de charger la fiche patient." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response) return auth.response;
    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;

    const payload = patientUpdateSchema.parse(raw);
    const keys = Object.keys(payload);
    const commentOnly = keys.length === 1 && keys[0] === "internalComment";
    const canUpdate = hasPermission(auth.user.role, "patients:update");
    const canComment = hasPermission(auth.user.role, "patients:comment");
    if (!(canUpdate || (commentOnly && canComment))) {
      return NextResponse.json({ message: "Acces non autorise pour votre role." }, { status: 403 });
    }
    const { id } = await params;
    const updated = await updatePatient(id, payload as Partial<PatientFormPayload>);
    if (!updated) {
      return NextResponse.json({ message: "Patient introuvable." }, { status: 404 });
    }
    return NextResponse.json({ id: updated.id, fullName: `${updated.firstName} ${updated.lastName}` }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("PATCH /api/patients/:id failed", error);
    return NextResponse.json({ message: "Impossible de modifier le patient." }, { status: 500 });
  }
}
