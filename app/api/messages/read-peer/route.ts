import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { markPeerMessagesRead } from "@/services/messages-service";
import { internalMessageReadPeerSchema } from "@/lib/validation/messages";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "messages:view");
    if (auth.response || !auth.user) return auth.response;

    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;

    const payload = internalMessageReadPeerSchema.parse(raw);
    const result = await markPeerMessagesRead(auth.user.id, payload.peerId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    console.error("POST /api/messages/read-peer failed", error);
    return NextResponse.json({ message: "Impossible de marquer les messages comme lus." }, { status: 500 });
  }
}
