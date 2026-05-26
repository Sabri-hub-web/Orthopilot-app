const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export function getGmailOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return { clientId, clientSecret, redirectUri };
}

export function isGmailConfigured(): boolean {
  return getGmailOAuthConfig() !== null;
}

export function buildGmailAuthUrl(state: string): string {
  const config = getGmailOAuthConfig();
  if (!config) throw new Error("Configuration Gmail OAuth manquante.");

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: GMAIL_READONLY_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export const GMAIL_SYNC_MAX_RESULTS = 50;
