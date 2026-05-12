import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { getThread, sendInternalMessage } from "@/services/messages-service";
import { internalMessageSendSchema } from "@/lib/validation/messages";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "messages:view");
    if (auth.response || !auth.user) return auth.response;

    const withPeer = request.nextUrl.searchParams.get("with")?.trim();
    if (!withPeer) {
      return NextResponse.json({ message: "Parametre with (id utilisateur) requis." }, { status: 400 });
    }

    const thread = await getThread(auth.user.id, withPeer);
    if (thread === "SELF") {
      return NextResponse.json({ message: "Destinataire invalide." }, { status: 400 });
    }
    if (!thread) {
      return NextResponse.json({ message: "Utilisateur introuvable." }, { status: 404 });
    }

    return NextResponse.json(thread, { status: 200 });
  } catch (error) {
    console.error("GET /api/messages failed", error);
    return NextResponse.json({ message: "Impossible de charger la conversation." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "messages:send");
    if (auth.response || !auth.user) return auth.response;

    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;

    const payload = internalMessageSendSchema.parse(raw);
    const result = await sendInternalMessage(
      auth.user.id,
      auth.user.fullName ?? auth.user.email,
      payload.recipientId,
      payload.body,
    );

    if (!result.ok) {
      if (result.reason === "SELF") {
        return NextResponse.json({ message: "Vous ne pouvez pas vous envoyer un message." }, { status: 400 });
      }
      return NextResponse.json({ message: "Destinataire introuvable." }, { status: 404 });
    }

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    console.error("POST /api/messages failed", error);
    return NextResponse.json({ message: "Impossible d envoyer le message." }, { status: 500 });
  }
}
