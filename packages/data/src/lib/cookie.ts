import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const key = (secret: string) => createHash('sha256').update(secret).digest();

export function encrypt(plaintext: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(secret), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64url');
}

export function decrypt(payload: string, secret: string): string {
  const buf = Buffer.from(payload, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', key(secret), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
}

export function parseCookies(header: string | undefined | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) continue;
    try {
      out[k] = decodeURIComponent(v);
    } catch {

    }
  }
  return out;
}

export function readTokenFromCookieHeader(
  header: string | undefined | null,
  cookieName: string,
  secret: string,
): string | null {
  const raw = parseCookies(header)[cookieName];
  if (!raw) return null;
  try {
    return decrypt(raw, secret);
  } catch {
    return null;
  }
}

