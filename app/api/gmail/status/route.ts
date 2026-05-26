import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getGmailStatusForUser } from "@/services/gmail-service";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response) return auth.response;

    const status = await getGmailStatusForUser(auth.user!.id);
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error("GET /api/gmail/status failed", error);
    return NextResponse.json({ message: "Impossible de lire le statut Gmail." }, { status: 500 });
  }
}
