import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { getLogsList } from "@/services/logs-service";

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "logs:view");
    if (auth.response) return auth.response;
    const searchParams = request.nextUrl.searchParams;
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const pageSizeRaw = parsePositiveInt(searchParams.get("pageSize"), 12);
    const pageSize = Math.min(pageSizeRaw, 50);

    const data = await getLogsList(page, pageSize);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET /api/logs failed", error);
    return NextResponse.json({ message: "Impossible de charger les logs." }, { status: 500 });
  }
}
