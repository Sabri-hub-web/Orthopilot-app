import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { prisma } from "@/server/db/client";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "calendar:manage");
    if (auth.response || !auth.user) return auth.response;

    const items = await prisma.user.findMany({
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error("GET /api/calendar/assignees failed", error);
    return NextResponse.json({ message: "Impossible de charger les utilisateurs." }, { status: 500 });
  }
}
