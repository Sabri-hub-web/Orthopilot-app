import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getApiUser(request);
    if (!user) {
      return NextResponse.json({ message: "Non authentifie." }, { status: 401 });
    }
    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("GET /api/auth/me failed", error);
    return NextResponse.json({ message: "Impossible de verifier la session." }, { status: 500 });
  }
}
