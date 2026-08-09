import type { EmailFormPayload, PriorityEmail } from "@/types/domain";

/** Module emails désactivé (modèles Email / EmailAttachment retirés du schéma). */

export function toPriorityEmail(_item: never): PriorityEmail {
  throw new Error("Module emails désactivé.");
}

export async function getEmailsList(page: number, pageSize: number) {
  return {
    items: [] as PriorityEmail[],
    total: 0,
    page,
    pageSize,
    totalPages: 1,
  };
}

export async function createEmail(_payload: EmailFormPayload): Promise<PriorityEmail> {
  throw new Error("Module emails désactivé.");
}

export async function updateEmail(
  _emailId: string,
  _payload: Partial<EmailFormPayload>,
): Promise<PriorityEmail | null> {
  return null;
}

export async function deleteEmail(_emailId: string) {
  return null;
}

export async function assignEmail(_emailId: string, _assigneeId: string | null) {
  return null;
}

export async function getEmailById(_emailId: string) {
  return null;
}

export async function generateEmailAiSummary(_emailId: string) {
  return null;
}
