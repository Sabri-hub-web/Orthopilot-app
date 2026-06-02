import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { addPatientComment, getPatientHub } from "@/services/patients-service";
import { parseJsonBody } from "@/lib/validation/http";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiPermission(request, "patients:view");
  if (auth.response) return auth.response;
  const { id } = await params;
  const hub = await getPatientHub(id);
  if (!hub) return NextResponse.json({ message: "Patient introuvable." }, { status: 404 });
  return NextResponse.json({ items: hub.comments }, { status: 200 });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request, "patients:comment");
    if (auth.response) return auth.response;
    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;
    const content = typeof (raw as { content?: unknown }).content === "string" ? (raw as { content: string }).content.trim() : "";
    if (!content) {
      return NextResponse.json({ message: "Contenu du commentaire requis." }, { status: 400 });
    }
    const { id } = await params;
    const comment = await addPatientComment(id, content, { id: auth.user.id, fullName: auth.user.fullName });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/patients/:id/comments failed", error);
    return NextResponse.json({ message: "Impossible d'ajouter le commentaire." }, { status: 500 });
  }
}
