import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiPermission, requireApiUser } from "@/lib/auth/api-guard";
import { createEmail, getEmailsList } from "@/services/emails-service";
import { emailCreateSchema } from "@/lib/validation/emails";
import { parseJsonBody, validationErrorResponse } from "@/lib/validation/http";

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser(request);
    if (auth.response) return auth.response;
    const searchParams = request.nextUrl.searchParams;
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const pageSizeRaw = parsePositiveInt(searchParams.get("pageSize"), 10);
    const pageSize = Math.min(pageSizeRaw, 50);

    const data = await getEmailsList(page, pageSize);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GET /api/emails failed", error);
    return NextResponse.json({ message: "Impossible de charger les emails." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiPermission(request, "emails:manage");
    if (auth.response) return auth.response;
    const raw = await parseJsonBody(request);
    if (raw instanceof NextResponse) return raw;

    const payload = emailCreateSchema.parse(raw);
    const item = await createEmail(payload);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationErrorResponse(error);
    }

    console.error("POST /api/emails failed", error);
    return NextResponse.json({ message: "Impossible de creer l'email." }, { status: 500 });
  }
}
