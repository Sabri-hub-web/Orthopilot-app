import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { buildGmailAuthUrl, isGmailConfigured, signOAuthState } from "@/services/gmail-service";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response) return auth.response;

    if (!isGmailConfigured()) {
      return NextResponse.json(
        { message: "Gmail OAuth non configure (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)." },
        { status: 503 },
      );
    }

    const state = signOAuthState(auth.user!.id);
    const url = buildGmailAuthUrl(state);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("GET /api/gmail/connect failed", error);
    return NextResponse.json({ message: "Impossible de demarrer la connexion Gmail." }, { status: 500 });
  }
}
