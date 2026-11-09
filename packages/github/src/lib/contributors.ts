import 'server-only';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';
import { env, featureMode } from '@terrafirmagreg-team/data/lib/env';
import { githubFetch } from '@terrafirmagreg-team/data/lib/github';

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
};

type ApiContributor = {
  login?: string;
  name?: string;
  avatar_url?: string;
  html_url?: string;
  contributions?: number;
  type?: string;
};

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

const stubContributors = (count = 14): RepoContributor[] =>
  Array.from({ length: count }, (_, i) => ({
    login: `contributor-${i + 1}`,
    avatarUrl: '',
    contributions: Math.max(120 - i * 8, 1),
    url: '',
    type: 'User',
  }));

export const repoContributors = createAsyncCache(
  async (
    repoUrl: string,
    options?: RepoContributorsOptions,
  ): Promise<RepoContributor[] | undefined> => {
    const mode = featureMode('GITHUB');
    if (mode === 'off') return undefined;
    const path = repoPath(repoUrl);
    const rows = path
      ? await fetchContributors(path).catch(() => undefined)
      : undefined;
    if (!rows?.length)
      return mode === 'dev' ? stubContributors() : undefined;
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
      .map((r): RepoContributor => {
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
        };
      });
    const merged = new Map<string, RepoContributor>();
    for (const c of mapped)
      if (c.type !== 'Anonymous')
        merged.set(`u:${c.login.toLowerCase()}`, c);
    for (const c of mapped) {
      if (c.type !== 'Anonymous') continue;
      const key = merged.has(`u:${c.login.toLowerCase()}`)
        ? `u:${c.login.toLowerCase()}`
        : `a:${c.login.toLowerCase()}`;
      const prev = merged.get(key);
      merged.set(
        key,
        prev
          ? { ...prev, contributions: prev.contributions + c.contributions }
          : c,
      );
    }
    return [...merged.values()].sort(
      (a, b) => b.contributions - a.contributions,
    );
  },
  (repoUrl, options) =>
    `${repoUrl}|${options?.minContributions ?? ''}|${[
      ...(options?.excludeUsers ?? []),
    ]
      .sort()
      .join(',')}`,
  3_600_000,
);
