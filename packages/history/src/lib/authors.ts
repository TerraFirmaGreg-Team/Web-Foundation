import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import type { AuthorMapping } from 'fumadocs-page-history/git';

export interface ResolveAuthorMappingsOptions {
  repository: string;
  directory: string;
  exclude?: readonly AuthorMapping[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  concurrency?: number;
}

const exec = promisify(execFile);
const LOGIN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const NOREPLY = /^(?:\d+\+)?[a-z\d](?:[a-z\d-]*[a-z\d])?@users\.noreply\.github\.com$/i;
const BOT = /\bbot\b\]?\s*$/i;
const SUCCESS_TTL = 7 * 24 * 60 * 60 * 1000;
const MISS_TTL = 5 * 60 * 1000;

type Identity = { name: string; email: string; shas: string[] };
type CacheEntry = { expiresAt: number; login: string | null };

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const gravatar = (email: string) =>
  `https://gravatar.com/avatar/${hash(email.trim().toLowerCase())}?d=identicon`;

function isExcluded(
  name: string,
  email: string,
  exclude: readonly AuthorMapping[] | undefined,
) {
  return (exclude ?? []).some(
    (mapping) =>
      (mapping.gitName &&
        mapping.gitName.trim().toLowerCase() === name.trim().toLowerCase()) ||
      (mapping.gitEmail &&
        mapping.gitEmail.trim().toLowerCase() === email.trim().toLowerCase()),
  );
}

async function git(root: string, args: string[]) {
  const { stdout } = await exec('git', ['-C', root, ...args], {
    maxBuffer: 32 * 1024 * 1024,
  });
  return stdout;
}

async function collectIdentities(directory: string): Promise<Identity[]> {
  const root = (
    await git(directory, ['rev-parse', '--show-toplevel'])
  ).trim();
  const log = await git(root, [
    'log',
    '--all',
    '--format=%an%x00%ae%x00%H%x00',
  ]);
  const byKey = new Map<string, Identity>();
  const parts = log.split('\0');
  for (let i = 0; i + 2 < parts.length; i += 3) {
    const name = parts[i].trim();
    const email = parts[i + 1].trim();
    const sha = parts[i + 2].trim();
    if (!name || !email || !sha) continue;
    const key = `${name.toLowerCase()} ${email.toLowerCase()}`;
    const identity = byKey.get(key);
    if (identity) {
      if (identity.shas.length < 5 && !identity.shas.includes(sha))
        identity.shas.push(sha);
    } else {
      byKey.set(key, { name, email, shas: [sha] });
    }
  }
  return [...byKey.values()];
}

async function readCache(dir: string, email: string) {
  try {
    const entry: CacheEntry = JSON.parse(
      await readFile(path.join(dir, `author-${hash(email)}.json`), 'utf8'),
    );
    if (entry.expiresAt > Date.now()) return entry.login;
  } catch {}
}

async function writeCache(dir: string, email: string, login: string | null) {
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `author-${hash(email)}.json`),
      JSON.stringify({
        expiresAt: Date.now() + (login ? SUCCESS_TTL : MISS_TTL),
        login,
      } satisfies CacheEntry),
    );
  } catch {}
}

function loginFromCommitHtml(html: string) {
  const text = html.replaceAll('&quot;', '"');
  const login =
    /"authors"\s*:\s*\[\s*\{[^}]*"login"\s*:\s*"([^"]+)"/.exec(text)?.[1] ??
    /commits\?author=([a-z\d-]+)/i.exec(text)?.[1];
  return login && LOGIN.test(login) && !BOT.test(login) ? login : null;
}

const resolved = new Map<string, Promise<AuthorMapping[]>>();

export function resolveAuthorMappings(
  options: ResolveAuthorMappingsOptions,
): Promise<AuthorMapping[]> {
  const key = `${options.repository} ${options.directory}`;
  let promise = resolved.get(key);
  if (!promise) {
    promise = resolve(options).catch(() => []);
    resolved.set(key, promise);
  }
  return promise;
}

async function resolve({
  repository,
  directory,
  exclude,
  fetchImpl = fetch,
  timeoutMs = 5000,
  concurrency = 4,
}: ResolveAuthorMappingsOptions): Promise<AuthorMapping[]> {
  const url = new URL(repository);
  if (url.hostname !== 'github.com') return [];
  const repoPath = url.pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '');
  if (!/^[\w.-]+\/[\w.-]+$/.test(repoPath)) return [];

  const identities = (await collectIdentities(directory)).filter(
    ({ name, email }) =>
      !NOREPLY.test(email) && !isExcluded(name, email, exclude),
  );
  if (!identities.length) return [];

  const root = (await git(directory, ['rev-parse', '--show-toplevel'])).trim();
  const cacheDir = path.join(
    root,
    'node_modules',
    '.cache',
    'terrafirmagreg-history',
  );

  const loginOf = new Map<string, string | null>();
  const lookup = async ({ name, email, shas }: Identity) => {
    const key = `${name} ${email}`;
    if (BOT.test(name)) {
      loginOf.set(key, null);
      return;
    }
    const cached = await readCache(cacheDir, email);
    if (cached !== undefined) {
      loginOf.set(key, cached);
      return;
    }
    let login: string | null = null;
    for (const sha of shas) {
      try {
        const response = await fetchImpl(
          `https://github.com/${repoPath}/commit/${sha}`,
          {
            headers: { 'user-agent': 'terrafirmagreg-history' },
            signal: AbortSignal.timeout(timeoutMs),
            redirect: 'follow',
          },
        );
        if (response.ok) {
          login = loginFromCommitHtml(await response.text());
          if (login) break;
        }
      } catch {}
    }
    loginOf.set(key, login);
    await writeCache(cacheDir, email, login);
  };

  for (let i = 0; i < identities.length; i += concurrency)
    await Promise.all(identities.slice(i, i + concurrency).map(lookup));

  return identities.map(({ name, email }) => {
    const login = loginOf.get(`${name} ${email}`);
    return login
      ? { gitName: name, gitEmail: email, githubUsername: login }
      : {
          gitName: name,
          gitEmail: email,
          githubUsername: name,
          displayName: name,
          avatar: gravatar(email),
          url: '',
        };
  });
}
