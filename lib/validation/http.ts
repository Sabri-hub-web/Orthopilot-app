import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(
    { message: "Donnees invalides. Merci de verifier les champs.", issues: error.issues },
    { status: 400 },
  );
}

export async function parseJsonBody(request: Request): Promise<unknown | NextResponse> {
  try {
    return await request.json();
  } catch {
    return NextResponse.json({ message: "Corps JSON invalide." }, { status: 400 });
  }
}
