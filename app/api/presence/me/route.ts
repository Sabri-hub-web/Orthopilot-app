import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiUser } from "@/lib/auth/api-guard";
import { presenceStatusLabel } from "@/lib/presence";
import { getMyPresenceStatus, setMyPresenceStatus } from "@/services/presence-service";
import { presenceMePatchSchema } from "@/lib/validation/presence";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response || !auth.user) return auth.response;

    const presenceStatus = await getMyPresenceStatus(auth.user.id);
    return NextResponse.json(
      {
        presenceStatus,
        presenceLabel: presenceStatusLabel(presenceStatus),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/presence/me failed", error);
    return NextResponse.json({ message: "Impossible de charger votre statut." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response || !auth.user) return auth.response;

    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;

    const payload = presenceMePatchSchema.parse(raw);
    await setMyPresenceStatus(auth.user.id, payload.presenceStatus);

    return NextResponse.json(
      {
        presenceStatus: payload.presenceStatus,
        presenceLabel: presenceStatusLabel(payload.presenceStatus),
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }
    console.error("PATCH /api/presence/me failed", error);
    return NextResponse.json({ message: "Impossible de mettre a jour votre statut." }, { status: 500 });
  }
}
