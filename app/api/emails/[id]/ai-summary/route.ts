import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { generateEmailAiSummary } from "@/services/emails-service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request, "emails:manage");
    if (auth.response) return auth.response;

    const { id } = await params;
    const item = await generateEmailAiSummary(id);
    if (!item) {
      return NextResponse.json({ message: "Email introuvable." }, { status: 404 });
    }

    return NextResponse.json(item, { status: 200 });
  } catch (error) {
    console.error("POST /api/emails/:id/ai-summary failed", error);
    return NextResponse.json({ message: "Impossible de generer le resume IA." }, { status: 500 });
  }
}
