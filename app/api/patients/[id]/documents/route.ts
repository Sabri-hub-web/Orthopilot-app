import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { addPatientDocumentPlaceholder, getPatientHub } from "@/services/patients-service";
import { parseJsonBody } from "@/lib/validation/http";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(request, "patients:view");
  if (auth.response) return auth.response;
  const { id } = await params;
  const hub = await getPatientHub(id);
  if (!hub) return NextResponse.json({ message: "Patient introuvable." }, { status: 404 });
  return NextResponse.json({ items: hub.documents }, { status: 200 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request, "patients:comment");
    if (auth.response) return auth.response;
    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;

    const name = typeof (raw as { name?: unknown }).name === "string" ? (raw as { name: string }).name.trim() : "";
    if (!name) {
      return NextResponse.json({ message: "Nom du document requis." }, { status: 400 });
    }
    const mimeType = typeof (raw as { mimeType?: unknown }).mimeType === "string" ? (raw as { mimeType: string }).mimeType : null;
    const sizeBytesRaw = (raw as { sizeBytes?: unknown }).sizeBytes;
    const sizeBytes = typeof sizeBytesRaw === "number" && Number.isFinite(sizeBytesRaw) ? Math.max(0, Math.trunc(sizeBytesRaw)) : 0;
    const storagePath = typeof (raw as { storagePath?: unknown }).storagePath === "string" ? (raw as { storagePath: string }).storagePath : null;
    const downloadUrl = typeof (raw as { downloadUrl?: unknown }).downloadUrl === "string" ? (raw as { downloadUrl: string }).downloadUrl : null;

    const { id } = await params;
    const document = await addPatientDocumentPlaceholder(
      id,
      { name, mimeType, sizeBytes, storagePath, downloadUrl },
      { id: auth.user.id, fullName: auth.user.fullName },
    );
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("POST /api/patients/:id/documents failed", error);
    return NextResponse.json({ message: "Impossible d'ajouter le document." }, { status: 500 });
  }
}
