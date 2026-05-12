import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { listRecipients } from "@/services/messages-service";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "messages:view");
    if (auth.response || !auth.user) return auth.response;

    const data = await listRecipients(auth.user.id);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET /api/messages/recipients failed", error);
    return NextResponse.json({ message: "Impossible de charger les destinataires." }, { status: 500 });
  }
}
