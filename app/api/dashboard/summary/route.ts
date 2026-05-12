import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getDashboardData } from "@/services/dashboard-service";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response) return auth.response;
    const data = await getDashboardData();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET /api/dashboard/summary failed", error);
    return NextResponse.json(
      { message: "Impossible de charger le resume dashboard." },
      { status: 500 },
    );
  }
}
