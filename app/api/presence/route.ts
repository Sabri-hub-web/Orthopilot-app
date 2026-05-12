import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { getTeamPresenceOverview } from "@/services/presence-service";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "presence:view");
    if (auth.response || !auth.user) return auth.response;

    const data = await getTeamPresenceOverview();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET /api/presence failed", error);
    return NextResponse.json({ message: "Impossible de charger la presence equipe." }, { status: 500 });
  }
}
