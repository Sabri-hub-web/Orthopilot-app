import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { registerRelance } from "@/services/reglements-service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request, "reglements:manage");
    if (auth.response) return auth.response;
    const { id } = await params;
    const result = await registerRelance(id);

    if (!result.ok) {
      if (result.reason === "NOT_FOUND") {
        return NextResponse.json({ message: "Reglement introuvable." }, { status: 404 });
      }
      return NextResponse.json(
        { message: "Impossible d'enregistrer une relance sur un reglement solde." },
        { status: 400 },
      );
    }

    return NextResponse.json(result.item, { status: 200 });
  } catch (error) {
    console.error("POST /api/reglements/:id/relance failed", error);
    return NextResponse.json({ message: "Impossible d'enregistrer la relance." }, { status: 500 });
  }
}
