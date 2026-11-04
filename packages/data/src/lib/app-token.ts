import { env } from './env';
import { githubFetch } from './github';

const TOKEN_TTL_MS = 50 * 60 * 1000;
const cache = new Map<string, { token: Promise<string>; exp: number }>();

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/\\n/g, '\n').replace(/-----(?:BEGIN|END)[^\n-]*-----|\s/g, '');
  const bin = Buffer.from(b64, 'base64');
  return bin.buffer.slice(
    bin.byteOffset,
    bin.byteOffset + bin.byteLength,
  ) as ArrayBuffer;
}

async function appJwt(): Promise<string> {
  const appId = env('APP_ID');
  const pem = env('APP_PRIVATE_KEY');
  if (!appId || !pem)
    throw new Error('APP_ID / APP_PRIVATE_KEY are not configured');
  const now = Math.floor(Date.now() / 1000);
  const pack = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const payload = `${pack({ alg: 'RS256', typ: 'JWT' })}.${pack({ iat: now - 60, exp: now + 540, iss: appId })}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(pem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(payload),
  );
  return `${payload}.${Buffer.from(signature).toString('base64url')}`;
}

async function mintInstallationToken(repo: string): Promise<string> {
  const jwt = await appJwt();
  const installation = await githubFetch(`/repos/${repo}/installation`, {
    token: jwt,
  });
  if (!installation.ok)
    throw new Error(`app installation lookup ${repo}: ${installation.status}`);
  const { id } = (await installation.json()) as { id: number };
  const response = await githubFetch(
    `/app/installations/${id}/access_tokens`,
    { token: jwt, method: 'POST' },
  );
  if (!response.ok)
    throw new Error(`app installation token ${repo}: ${response.status}`);
  return ((await response.json()) as { token: string }).token;
}

export function githubAppToken(repo: string): Promise<string> {
  const cached = cache.get(repo);
  if (cached && cached.exp > Date.now()) return cached.token;
  const entry = {
    token: mintInstallationToken(repo).catch((err) => {
      cache.delete(repo);
      throw err;
    }),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  cache.set(repo, entry);
  return entry.token;
}

