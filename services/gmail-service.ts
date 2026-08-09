import {
  buildGmailAuthUrl,
  getGmailOAuthConfig,
  isGmailConfigured,
} from "@/lib/gmail/config";
import { signOAuthState, verifyOAuthState } from "@/server/crypto/token-cipher";

export { isGmailConfigured, signOAuthState, verifyOAuthState, buildGmailAuthUrl };

export class GmailAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GmailAuthError";
  }
}

/** Gmail désactivé (modèles GmailAccount / Email retirés du schéma). */

export async function exchangeGmailCode(
  _code: string,
): Promise<{ access_token?: string; refresh_token?: string; expires_in?: number }> {
  throw new GmailAuthError("Module Gmail désactivé.");
}

export async function saveGmailAccountForUser(
  _userId: string,
  _tokens: { access_token?: string; refresh_token?: string; expires_in?: number },
): Promise<{ gmailEmail: string }> {
  throw new GmailAuthError("Module Gmail désactivé.");
}

export async function getGmailStatusForUser(_userId: string) {
  return {
    connected: false as const,
    configured: isGmailConfigured(),
  };
}

export async function getValidGmailAccessToken(_userId: string): Promise<string> {
  throw new GmailAuthError("Module Gmail désactivé.");
}

export async function syncGmailForUser(
  _userId: string,
): Promise<{ imported: number; skipped: number }> {
  throw new GmailAuthError("Module Gmail désactivé.");
}

export function getGmailOAuthConfigSafe() {
  return getGmailOAuthConfig();
}
