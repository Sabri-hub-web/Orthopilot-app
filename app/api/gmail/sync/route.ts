import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { GmailAuthError, getGmailStatusForUser, syncGmailForUser } from "@/services/gmail-service";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response) return auth.response;

    const status = await getGmailStatusForUser(auth.user!.id);
    if (!status.connected) {
      return NextResponse.json({ message: "Gmail non connecte." }, { status: 400 });
    }

    const result = await syncGmailForUser(auth.user!.id);
    const updatedStatus = await getGmailStatusForUser(auth.user!.id);

    return NextResponse.json(
      {
        ...result,
        status: updatedStatus,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof GmailAuthError) {
      return NextResponse.json({ message: error.message, reconnectRequired: true }, { status: 401 });
    }
    console.error("POST /api/gmail/sync failed", error);
    return NextResponse.json({ message: "Synchronisation Gmail impossible." }, { status: 500 });
  }
}
