import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { runPatientCsvImport } from "@/services/patients-import-service";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "patients:import");
    if (auth.response) return auth.response;
    if (!auth.user) {
      return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Fichier CSV manquant (champ file)." }, { status: 400 });
    }

    const text = await file.text();
    const result = await runPatientCsvImport({
      csvText: text,
      actorName: auth.user.fullName,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import CSV impossible.";
    console.error("POST /api/patients/import failed", error);
    return NextResponse.json({ message }, { status: 400 });
  }
}
