import { prisma } from "@/server/db/client";
import { encryptSecret, decryptSecret, signOAuthState, verifyOAuthState } from "@/server/crypto/token-cipher";
import {
  buildGmailAuthUrl,
  getGmailOAuthConfig,
  GMAIL_SYNC_MAX_RESULTS,
  isGmailConfigured,
} from "@/lib/gmail/config";
import { inferEmailCategory, parseGmailMessage, type GmailMessagePayload } from "@/lib/gmail/message-parser";
import { writeActivityLog } from "@/server/activity-log";
import type { EmailCategory } from "@prisma/client";

export { isGmailConfigured, signOAuthState, verifyOAuthState, buildGmailAuthUrl };

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

type GmailListResponse = {
  messages?: { id: string; threadId: string }[];
  resultSizeEstimate?: number;
};

export class GmailAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GmailAuthError";
  }
}

async function exchangeToken(body: Record<string, string>): Promise<TokenResponse> {
  const config = getGmailOAuthConfig();
  if (!config) throw new GmailAuthError("Configuration Gmail OAuth manquante.");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      ...body,
    }),
  });

  const data = (await response.json()) as TokenResponse & { error?: string; error_description?: string };
  if (!response.ok) {
    throw new GmailAuthError(data.error_description ?? data.error ?? "Echec OAuth Google.");
  }
  return data;
}

export async function exchangeGmailCode(code: string) {
  const config = getGmailOAuthConfig();
  if (!config) throw new GmailAuthError("Configuration Gmail OAuth manquante.");
  return exchangeToken({
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  });
}

async function fetchGmailProfile(accessToken: string): Promise<{ emailAddress: string }> {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new GmailAuthError("Impossible de recuperer le profil Gmail.");
  }
  return response.json() as Promise<{ emailAddress: string }>;
}

export async function saveGmailAccountForUser(
  userId: string,
  tokens: TokenResponse,
): Promise<{ gmailEmail: string }> {
  if (!tokens.access_token) {
    throw new GmailAuthError("Access token Gmail manquant.");
  }

  const profile = await fetchGmailProfile(tokens.access_token);
  const expiresAt =
    tokens.expires_in && Number.isFinite(tokens.expires_in)
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

  const existing = await prisma.gmailAccount.findUnique({ where: { userId } });

  if (!tokens.refresh_token && !existing?.refreshTokenEnc) {
    throw new GmailAuthError("Refresh token Gmail manquant. Reconnectez Gmail avec consentement.");
  }

  const refreshTokenPlain = tokens.refresh_token
    ? tokens.refresh_token
    : decryptSecret(existing!.refreshTokenEnc);

  await prisma.gmailAccount.upsert({
    where: { userId },
    create: {
      userId,
      gmailEmail: profile.emailAddress,
      accessTokenEnc: encryptSecret(tokens.access_token),
      refreshTokenEnc: encryptSecret(refreshTokenPlain),
      expiresAt,
    },
    update: {
      gmailEmail: profile.emailAddress,
      accessTokenEnc: encryptSecret(tokens.access_token),
      refreshTokenEnc: encryptSecret(refreshTokenPlain),
      expiresAt,
    },
  });

  await writeActivityLog({
    actor: "Systeme",
    message: `Connexion Gmail : ${profile.emailAddress}`,
  });

  return { gmailEmail: profile.emailAddress };
}

export async function getGmailStatusForUser(userId: string) {
  const account = await prisma.gmailAccount.findUnique({ where: { userId } });
  if (!account) {
    return {
      connected: false as const,
      configured: isGmailConfigured(),
    };
  }

  const importedTotal = await prisma.email.count({
    where: { importedFrom: "GMAIL" },
  });

  return {
    connected: true as const,
    configured: isGmailConfigured(),
    gmailEmail: account.gmailEmail,
    lastSyncAt: account.lastSyncAt?.toISOString() ?? null,
    lastSyncCount: account.lastSyncCount,
    importedTotal,
  };
}

async function refreshGmailAccessToken(userId: string, refreshTokenEnc: string): Promise<string> {
  const refreshToken = decryptSecret(refreshTokenEnc);
  const tokens = await exchangeToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  if (!tokens.access_token) {
    throw new GmailAuthError("Refresh token Gmail invalide. Reconnectez Gmail.");
  }

  const expiresAt =
    tokens.expires_in && Number.isFinite(tokens.expires_in)
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

  await prisma.gmailAccount.update({
    where: { userId },
    data: {
      accessTokenEnc: encryptSecret(tokens.access_token),
      expiresAt,
    },
  });

  return tokens.access_token;
}

export async function getValidGmailAccessToken(userId: string): Promise<string> {
  const account = await prisma.gmailAccount.findUnique({ where: { userId } });
  if (!account) {
    throw new GmailAuthError("Gmail non connecte.");
  }

  const needsRefresh =
    !account.expiresAt || account.expiresAt.getTime() <= Date.now() + 60_000;

  if (!needsRefresh) {
    return decryptSecret(account.accessTokenEnc);
  }

  return refreshGmailAccessToken(userId, account.refreshTokenEnc);
}

async function gmailFetch(accessToken: string, path: string): Promise<Response> {
  return fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function fetchGmailMessage(accessToken: string, messageId: string): Promise<GmailMessagePayload> {
  const response = await gmailFetch(
    accessToken,
    `/messages/${encodeURIComponent(messageId)}?format=full`,
  );
  if (!response.ok) {
    throw new Error(`Gmail message.get failed (${response.status})`);
  }
  return response.json() as Promise<GmailMessagePayload>;
}

async function upsertImportedEmail(parsed: ReturnType<typeof parseGmailMessage>, category: EmailCategory) {
  const existing = await prisma.email.findUnique({
    where: { gmailMessageId: parsed.gmailMessageId },
    select: { id: true, comment: true, status: true, category: true, assigneeId: true, patientId: true },
  });

  if (existing) {
    await prisma.email.update({
      where: { id: existing.id },
      data: {
        sender: parsed.sender,
        subject: parsed.subject,
        receivedAt: parsed.receivedAt,
        snippet: parsed.snippet,
        bodyText: parsed.bodyText,
      },
    });
    return { created: false };
  }

  await prisma.email.create({
    data: {
      sender: parsed.sender,
      subject: parsed.subject,
      receivedAt: parsed.receivedAt,
      category,
      status: "A_TRAITER",
      snippet: parsed.snippet,
      bodyText: parsed.bodyText,
      gmailMessageId: parsed.gmailMessageId,
      gmailThreadId: parsed.gmailThreadId,
      importedFrom: "GMAIL",
    },
  });
  return { created: true };
}

export async function syncGmailForUser(userId: string) {
  const accessToken = await getValidGmailAccessToken(userId);

  const listResponse = await gmailFetch(
    accessToken,
    `/messages?maxResults=${GMAIL_SYNC_MAX_RESULTS}&labelIds=INBOX`,
  );

  if (listResponse.status === 401) {
    throw new GmailAuthError("Session Gmail expiree. Reconnectez Gmail.");
  }
  if (!listResponse.ok) {
    throw new Error(`Gmail messages.list failed (${listResponse.status})`);
  }

  const listData = (await listResponse.json()) as GmailListResponse;
  const messageRefs = listData.messages ?? [];

  let created = 0;
  let updated = 0;

  for (const ref of messageRefs) {
    try {
      const raw = await fetchGmailMessage(accessToken, ref.id);
      const parsed = parseGmailMessage(raw);
      const category = inferEmailCategory(parsed.subject, parsed.bodyText);
      const result = await upsertImportedEmail(parsed, category);
      if (result.created) created += 1;
      else updated += 1;
    } catch (err) {
      console.error("[gmail/sync] message import failed", ref.id, err);
    }
  }

  const syncCount = created + updated;
  await prisma.gmailAccount.update({
    where: { userId },
    data: {
      lastSyncAt: new Date(),
      lastSyncCount: syncCount,
    },
  });

  if (created > 0) {
    await writeActivityLog({
      actor: "Systeme",
      message: `Synchronisation Gmail : ${created} nouveau(x), ${updated} mis a jour.`,
    });
  }

  return { created, updated, total: syncCount };
}
