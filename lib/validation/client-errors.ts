import type { ZodIssue } from "zod";

export type ApiErrorBody = {
  message?: string;
  issues?: ZodIssue[];
};

/** Construit un message lisible pour la secrétaire à partir de la réponse API. */
export async function errorMessageFromResponse(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ApiErrorBody;
    const base =
      typeof data.message === "string" && data.message.length > 0
        ? data.message
        : `Erreur ${response.status}`;

    if (data.issues && data.issues.length > 0) {
      const detail = data.issues
        .slice(0, 4)
        .map((i) => i.message)
        .join(" — ");
      return `${base} ${detail}`;
    }
    return base;
  } catch {
    return `Erreur ${response.status}`;
  }
}
