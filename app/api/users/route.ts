import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { prisma } from "@/server/db/client";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "users:view");
    if (auth.response) return auth.response;
    const users = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: "asc" },
    });
    return NextResponse.json({ items: users }, { status: 200 });
  } catch (error) {
    console.error("GET /api/users failed", error);
    return NextResponse.json({ message: "Impossible de charger les utilisateurs." }, { status: 500 });
  }
}
