import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiPermission, requireApiUser } from "@/lib/auth/api-guard";
import { PatientFormPayload } from "@/types/domain";
import { createPatient, getPatientsList } from "@/services/patients-service";
import { patientCreateSchema, patientsListQuerySchema } from "@/lib/validation/patients";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response) return auth.response;

    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = patientsListQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const data = await getPatientsList(parsed.data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET /api/patients failed", error);
    return NextResponse.json({ message: "Impossible de charger les patients." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "patients:create");
    if (auth.response) return auth.response;
    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;

    const payload = patientCreateSchema.parse(raw);
    const created = await createPatient(payload as PatientFormPayload);
    return NextResponse.json({ id: created.id, fullName: `${created.firstName} ${created.lastName}` }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("POST /api/patients failed", error);
    return NextResponse.json({ message: "Impossible de creer le patient." }, { status: 500 });
  }
}
