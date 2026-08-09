import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { getPatientHub } from "@/services/patients-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(request, "patients:view");
  if (auth.response) return auth.response;
  const { id } = await params;
  const hub = await getPatientHub(id);
  if (!hub) return NextResponse.json({ message: "Patient introuvable." }, { status: 404 });
  return NextResponse.json({ items: hub.documents }, { status: 200 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(request, "patients:comment");
  if (auth.response) return auth.response;
  void params;
  return NextResponse.json(
    { message: "Les documents patients ne sont plus disponibles." },
    { status: 410 },
  );
}
