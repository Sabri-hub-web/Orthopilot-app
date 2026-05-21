import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-guard";
import { downloadMessageAttachmentFile } from "@/server/storage/message-attachments-storage";
import { getMessageAttachmentForUser } from "@/services/messages-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiPermission(request, "messages:view");
    if (auth.response || !auth.user) return auth.response;

    const { id } = await context.params;
    const result = await getMessageAttachmentForUser(auth.user.id, id);

    if (!result.ok) {
      if (result.reason === "FORBIDDEN") {
        return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
      }
      return NextResponse.json({ message: "Fichier introuvable." }, { status: 404 });
    }

    const buffer = await downloadMessageAttachmentFile(result.storageKey);
    const inline = request.nextUrl.searchParams.get("inline") === "1";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Length": String(buffer.length),
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(result.fileName)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("GET /api/messages/attachments/[id] failed", error);
    return NextResponse.json({ message: "Impossible de charger le fichier." }, { status: 500 });
  }
}
