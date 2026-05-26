import crypto from "node:crypto";

const ALGO = "aes-256-gcm";

function encryptionKey(): Buffer {
  const secret =
    process.env.GMAIL_TOKEN_ENCRYPTION_KEY ??
    process.env.AUTH_SECRET ??
    process.env.DATABASE_URL ??
    "";
  if (!secret) {
    throw new Error("GMAIL_TOKEN_ENCRYPTION_KEY ou AUTH_SECRET requis pour chiffrer les tokens.");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${encrypted.toString("base64url")}.${tag.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  const [ivB64, encB64, tagB64] = payload.split(".");
  if (!ivB64 || !encB64 || !tagB64) {
    throw new Error("Token chiffré invalide.");
  }
  const iv = Buffer.from(ivB64, "base64url");
  const encrypted = Buffer.from(encB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const decipher = crypto.createDecipheriv(ALGO, encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export function signOAuthState(userId: string): string {
  const ts = Date.now();
  const nonce = crypto.randomBytes(16).toString("hex");
  const data = `${userId}:${ts}:${nonce}`;
  const sig = crypto.createHmac("sha256", encryptionKey()).update(data).digest("base64url");
  return Buffer.from(`${data}:${sig}`).toString("base64url");
}

export function verifyOAuthState(state: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon === -1) return null;
    const data = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const expected = crypto.createHmac("sha256", encryptionKey()).update(data).digest("base64url");
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
    const [userId, tsStr] = data.split(":");
    const ts = Number(tsStr);
    if (!userId || !Number.isFinite(ts) || Date.now() - ts > OAUTH_STATE_TTL_MS) return null;
    return { userId };
  } catch {
    return null;
  }
}
