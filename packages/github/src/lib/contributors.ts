import 'server-only';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';
import { env, featureMode } from '@terrafirmagreg-team/data/lib/env';
import { githubFetch } from '@terrafirmagreg-team/data/lib/github';
import {
  persistentCache,
  persistentGet,
  persistentSet,
} from '@terrafirmagreg-team/data/lib/persistent-cache';

const PER_PAGE = 100;
const MAX_PAGES = 3;
const BOT_LOGIN = /\[bot\]$/i;

export type RepoContributor = {
  login: string;
  avatarUrl: string;
  contributions: number;
  url: string;
  type: string;
};

export type RepoContributorsOptions = {
  excludeUsers?: readonly string[];
  minContributions?: number;
  mergeUsers?: Record<string, string>;
};

type ApiContributor = {
  login?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  html_url?: string;
  contributions?: number;
  type?: string;
};

type MappedRow = RepoContributor & { email?: string };

function repoPath(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com') return undefined;
    const path = parsed.pathname
      .replace(/^\/+|\/+$/g, '')
      .replace(/\.git$/, '');
    return /^[\w.-]+\/[\w.-]+$/.test(path) ? path : undefined;
  } catch {
    return undefined;
  }
}

async function fetchContributors(
  path: string,
): Promise<ApiContributor[] | undefined> {
  const token = env('GITHUB_TOKEN');
  const rows: ApiContributor[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await githubFetch(
      `/repos/${path}/contributors?per_page=${PER_PAGE}&page=${page}&anon=1`,
      { token, timeoutMs: 8000 },
    );
    if (!res.ok) return undefined;
    const batch = (await res.json()) as ApiContributor[];
    if (!Array.isArray(batch)) return undefined;
    rows.push(...batch);
    if (batch.length < PER_PAGE) break;
  }
  return rows;
}

const NOREPLY_LOGIN =
  /^(?:\d+\+)?([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)@users\.noreply\.github\.com$/i;

async function resolveLoginByAuthorName(
  path: string,
  name: string,
  token?: string,
): Promise<string | undefined> {
  const res = await githubFetch(
    `/search/commits?q=${encodeURIComponent(`repo:${path} author-name:"${name.replaceAll('"', '')}"`)}&per_page=20`,
    { token, timeoutMs: 5000 },
  );
  if (!res.ok) return undefined;
  const json = (await res.json()) as {
    items?: { author?: { login?: string } | null }[];
  };
  const counts = new Map<string, number>();
  for (const item of json.items ?? []) {
    const login = item.author?.login;
    if (login) counts.set(login, (counts.get(login) ?? 0) + 1);
  }
  let top: string | undefined;
  let topCount = 0;
  let second = 0;
  for (const [login, n] of counts) {
    if (n > topCount) {
      second = topCount;
      top = login;
      topCount = n;
    } else if (n > second) second = n;
  }
  return top && topCount > second ? top : undefined;
}

const stubContributors = (count = 14): RepoContributor[] =>
  Array.from({ length: count }, (_, i) => ({
    login: `contributor-${i + 1}`,
    avatarUrl: '',
    contributions: Math.max(120 - i * 8, 1),
    url: '',
    type: 'User',
  }));

const IDENTITY_TTL = 90 * 86_400_000;
const CONTRIBUTORS_TTL = 24 * 3_600_000;

function optsKey(options?: RepoContributorsOptions): string {
  return `${options?.minContributions ?? ''}|${[
    ...(options?.excludeUsers ?? []),
  ]
    .sort()
    .join(',')}|${Object.entries(options?.mergeUsers ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(',')}`;
}

async function buildContributors(
  repoUrl: string,
  path: string,
  options?: RepoContributorsOptions,
): Promise<RepoContributor[] | undefined> {
  const rows = await fetchContributors(path).catch(() => undefined);
  if (!rows?.length) return undefined;
  const excluded = new Set(
      options?.excludeUsers?.map((u) => u.toLowerCase()) ?? [],
    );
    const min = options?.minContributions ?? 1;
    const mapped = rows
      .filter(
        (r) =>
          (typeof r.login === 'string' ||
            (r.type === 'Anonymous' && typeof r.name === 'string')) &&
          r.type !== 'Bot' &&
          !BOT_LOGIN.test(r.login ?? ''),
      )
      .filter((r) => !excluded.has((r.login ?? r.name)!.toLowerCase()))
      .filter((r) => (r.contributions ?? 0) >= min)
      .map((r): MappedRow => {
        const login = r.login ?? r.name!;
        return {
          login,
          avatarUrl: r.avatar_url ?? '',
          contributions: r.contributions ?? 0,
          url:
            r.html_url ??
            (r.login
              ? `https://github.com/${r.login}`
              : `${repoUrl}/commits?author=${encodeURIComponent(login)}`),
          type: r.type ?? 'User',
          email: typeof r.email === 'string' ? r.email : undefined,
        };
      });

    const merged = new Map<string, MappedRow>();
    const userKey = (login: string) => `u:${login.toLowerCase()}`;
    const anonKey = (name: string) => `a:${name.toLowerCase()}`;
    const mergeIntoUser = (login: string, row: MappedRow) => {
      const key = userKey(login);
      const prev = merged.get(key);
      if (prev)
        merged.set(key, {
          ...prev,
          contributions: prev.contributions + row.contributions,
        });
      return merged.has(key);
    };
    for (const c of mapped)
      if (c.type !== 'Anonymous') merged.set(userKey(c.login), c);

    const anons = new Map<string, MappedRow>();
    for (const c of mapped) {
      if (c.type !== 'Anonymous') continue;
      const key = anonKey(c.login);
      const prev = anons.get(key);
      anons.set(
        key,
        prev
          ? { ...prev, contributions: prev.contributions + c.contributions }
          : c,
      );
    }

    const seenEmail = new Map<string, string>();
    for (const [key, row] of [...anons]) {
      const email = row.email?.toLowerCase();
      if (!email) continue;
      const other = seenEmail.get(email);
      if (!other || other === key) {
        seenEmail.set(email, key);
        continue;
      }
      const otherRow = anons.get(other);
      const [big, small] =
        row.contributions >= (otherRow?.contributions ?? 0)
          ? [key, other]
          : [other, key];
      const a = anons.get(big)!;
      const b = anons.get(small)!;
      anons.set(big, {
        ...a,
        contributions: a.contributions + b.contributions,
      });
      anons.delete(small);
      seenEmail.set(email, big);
    }

    for (const [key, row] of anons)
      if (mergeIntoUser(row.login, row)) anons.delete(key);

    for (const [key, row] of anons) {
      const login = row.email && NOREPLY_LOGIN.exec(row.email)?.[1];
      if (login && mergeIntoUser(login, row)) anons.delete(key);
    }

    const identity: Record<string, string> =
      (
        await persistentGet<Record<string, string>>(
          `gh-identity:${path}`,
        )
      )?.value ?? {};
    let identityDirty = false;
    const learn = (key: string, login: string) => {
      if (!identity[key]) {
        identity[key] = login;
        identityDirty = true;
      }
    };
    const resolveAnon = (key: string, row: MappedRow, login?: string) => {
      if (
        login &&
        (excluded.has(login.toLowerCase()) || mergeIntoUser(login, row))
      )
        anons.delete(key);
    };

    for (const [key, row] of anons) {
      const login =
        identity[`name:${row.login.toLowerCase()}`] ??
        (row.email ? identity[`email:${row.email.toLowerCase()}`] : undefined);
      resolveAnon(key, row, login);
    }

    for (const [key, row] of anons) {
      const login = row.email && NOREPLY_LOGIN.exec(row.email)?.[1];
      if (!login) continue;
      learn(`email:${row.email!.toLowerCase()}`, login);
      resolveAnon(key, row, login);
      if (!anons.has(key)) learn(`name:${row.login.toLowerCase()}`, login);
    }

    const aliases = new Map(
      Object.entries(options?.mergeUsers ?? {}).map(([name, login]) => [
        name.toLowerCase(),
        login,
      ]),
    );
    for (const [key, row] of anons)
      resolveAnon(key, row, aliases.get(row.login.toLowerCase()));

    if (anons.size) {
      const token = env('GITHUB_TOKEN');
      const pending = [...anons.entries()];
      const results = await Promise.allSettled(
        pending.map(([, row]) =>
          resolveLoginByAuthorName(path, row.login, token),
        ),
      );
      pending.forEach(([key, row], i) => {
        const res = results[i];
        const login = res.status === 'fulfilled' ? res.value : undefined;
        if (!login) return;
        learn(`name:${row.login.toLowerCase()}`, login);
        if (row.email) learn(`email:${row.email.toLowerCase()}`, login);
        resolveAnon(key, row, login);
      });
    }

    if (identityDirty)
      void persistentSet(`gh-identity:${path}`, identity, IDENTITY_TTL).catch(
        () => {},
      );

    for (const row of anons.values()) merged.set(anonKey(row.login), row);
    return [...merged.values()]
      .map(({ email: _email, ...row }) => row)
      .sort((a, b) => b.contributions - a.contributions);
}

export const repoContributors = createAsyncCache(
  async (
    repoUrl: string,
    options?: RepoContributorsOptions,
  ): Promise<RepoContributor[] | undefined> => {
    const mode = featureMode('GITHUB');
    if (mode === 'off') return undefined;
    const path = repoPath(repoUrl);
    const out = path
      ? await persistentCache(
          `gh-contributors:${path}|${optsKey(options)}`,
          CONTRIBUTORS_TTL,
          () => buildContributors(repoUrl, path, options),
          { staleWhileRevalidate: true },
        )
      : undefined;
    if (!out?.length) return mode === 'dev' ? stubContributors() : undefined;
    return out;
  },
  (repoUrl, options) => `${repoUrl}|${optsKey(options)}`,
  3_600_000,
);
