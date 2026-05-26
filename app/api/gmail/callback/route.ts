import { NextRequest, NextResponse } from "next/server";
import {
  exchangeGmailCode,
  saveGmailAccountForUser,
  verifyOAuthState,
} from "@/services/gmail-service";

function redirectToEmails(request: NextRequest, query: Record<string, string>) {
  const base = new URL("/emails", request.url);
  for (const [key, value] of Object.entries(query)) {
    base.searchParams.set(key, value);
  }
  return NextResponse.redirect(base);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const error = searchParams.get("error");
    if (error) {
      return redirectToEmails(request, { gmail: "error", reason: error });
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code || !state) {
      return redirectToEmails(request, { gmail: "error", reason: "missing_code" });
    }

    const verified = verifyOAuthState(state);
    if (!verified) {
      return redirectToEmails(request, { gmail: "error", reason: "invalid_state" });
    }

    const tokens = await exchangeGmailCode(code);
    await saveGmailAccountForUser(verified.userId, tokens);

    return redirectToEmails(request, { gmail: "connected" });
  } catch (err) {
    console.error("GET /api/gmail/callback failed", err);
    return redirectToEmails(request, { gmail: "error", reason: "callback_failed" });
  }
}
