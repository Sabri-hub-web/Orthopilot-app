import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { getSettingsOverview } from "@/services/settings-service";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "settings:view");
    if (auth.response) return auth.response;
    const data = await getSettingsOverview();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET /api/settings failed", error);
    return NextResponse.json({ message: "Impossible de charger les parametres." }, { status: 500 });
  }
}
