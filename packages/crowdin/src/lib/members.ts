import 'server-only';
import { Client } from '@crowdin/crowdin-api-client';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';
import { env, featureMode } from '@terrafirmagreg-team/data/lib/env';
import { persistentCache } from '@terrafirmagreg-team/data/lib/persistent-cache';

const CROWDIN_ORG = 'terrafirmagreg';
const REPORT_POLL_MS = 1500;
const REPORT_ATTEMPTS = 40;
const PERSIST_TTL = 24 * 3_600_000;

export type CrowdinLanguage = { id: string; name: string };

export type CrowdinMember = {
  username: string;
  fullName: string | null;
  avatarUrl: string;
  translated: number;
  approved: number;
  languages: CrowdinLanguage[];
  roles: string[];
  joinedAt: number | null;
  isNew: boolean;
};

const NEW_MEMBER_MS = 90 * 86_400_000;

const joined = (raw: string | null | undefined) => {
  const at = raw ? Date.parse(`${raw.replace(' ', 'T')}Z`) : NaN;
  return Number.isNaN(at) ? { joinedAt: null, isNew: false } : {
    joinedAt: at,
    isNew: Date.now() - at < NEW_MEMBER_MS,
  };
};

type ReportRow = {
  user: {
    id: number;
    username: string;
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    joined?: string | null;
  };
  translated: number | string;
  approved: number | string;
  languages?: CrowdinLanguage[];
};

export type CrowdinMembersOptions = {
  excludeUsers?: readonly string[];
  minWords?: number;
};

export type CrowdinLanguageProgress = {
  languageId: string;
  translation: number;
  approval: number;
  words: number;
  total: number;
};

const client = () => {
  const token = env('CROWDIN_API_TOKEN');
  return token ? new Client({ token, organization: CROWDIN_ORG }) : undefined;
};

const projectId = createAsyncCache(async (slug: string) => {
  const api = client()?.projectsGroupsApi.withFetchAll();
  const res = await api?.listProjects().catch(() => undefined);
  const name = slug.toLowerCase();
  return res?.data.find(
    (p) => p.data.identifier === slug || p.data.name.toLowerCase() === name,
  )?.data.id;
});

async function topMembers(api: Client, id: number) {
  const report = await api.reportsApi.generateReport(id, {
    name: 'top-members',
    schema: { unit: 'words', format: 'json' },
  });
  const reportId = report.data.identifier;
  for (let i = 0; i < REPORT_ATTEMPTS; i++) {
    const status = await api.reportsApi.checkReportStatus(id, reportId);
    if (status.data.status === 'finished') {
      const link = await api.reportsApi.downloadReport(id, reportId);
      const res = await fetch(link.data.url);
      if (!res.ok) return undefined;
      return ((await res.json()) as { data?: ReportRow[] }).data;
    }
    if (!['created', 'in_progress', 'in-progress'].includes(status.data.status))
      return undefined;
    await new Promise((resolve) => setTimeout(resolve, REPORT_POLL_MS));
  }
  return undefined;
}

const projectRoles = createAsyncCache(async (slug: string) => {
  const api = client()?.usersApi.withFetchAll();
  const id = api ? await projectId(slug) : undefined;
  const map = new Map<string, string[]>();
  if (!api || id === undefined) return map;
  const res = await api.listProjectMembers(id).catch(() => undefined);
  for (const { data: m } of res?.data ?? [])
    map.set(
      m.username,
      (m.roles ?? []).map((r) => r.name),
    );
  return map;
});

const STUB_LANGS: CrowdinLanguage[] = [
  { id: 'ru', name: 'Russian' },
  { id: 'pl', name: 'Polish' },
  { id: 'de', name: 'German' },
];

export const crowdinProgress = createAsyncCache(
  async (
    slug: string,
  ): Promise<Record<string, CrowdinLanguageProgress> | undefined> => {
    const mode = featureMode('CROWDIN');
    if (mode === 'off') return undefined;
    const api = client();
    const id = api ? await projectId(slug) : undefined;
    if (!api || id === undefined) {
      if (mode !== 'dev') return undefined;
      const out: Record<string, CrowdinLanguageProgress> = {};
      STUB_LANGS.forEach((l, i) => {
        out[l.id] = {
          languageId: l.id,
          translation: 70 - i * 20,
          approval: 40 - i * 15,
          words: 5000 - i * 1500,
          total: 10000,
        };
      });
      return out;
    }
    return persistentCache(`crowdin-progress:${slug}`, PERSIST_TTL, async () => {
      const res = await api.translationStatusApi
        .withFetchAll()
        .getProjectProgress(id)
        .catch(() => undefined);
      const out: Record<string, CrowdinLanguageProgress> = {};
      for (const { data: p } of res?.data ?? [])
        out[p.languageId] = {
          languageId: p.languageId,
          translation: p.translationProgress,
          approval: p.approvalProgress,
          words: p.words.translated,
          total: p.words.total,
        };
      return out;
    });
  },
  (slug) => slug,
  3_600_000,
);

const stubMembers = (count = 14): CrowdinMember[] =>
  Array.from({ length: count }, (_, i) => ({
    username: `translator-${i + 1}`,
    fullName: `Translator ${i + 1}`,
    avatarUrl: '',
    translated: 0,
    approved: 0,
    languages: STUB_LANGS.slice(0, (i % STUB_LANGS.length) + 1),
    roles: i === 0 ? ['manager'] : i === 1 ? ['developer'] : ['translator'],
    ...joined(
      new Date(Date.now() - (i * 30 + 10) * 86_400_000)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19),
    ),
  }));

export const crowdinMembers = createAsyncCache(
  async (
    slug: string,
    options?: CrowdinMembersOptions,
  ): Promise<CrowdinMember[] | undefined> => {
    const mode = featureMode('CROWDIN');
    if (mode === 'off') return undefined;
    const api = client();
    const id = api ? await projectId(slug) : undefined;
    if (!api || id === undefined)
      return mode === 'dev' ? stubMembers() : undefined;
    const persistKey = `crowdin-members:${slug}:${options?.minWords ?? ''}:${[
      ...(options?.excludeUsers ?? []),
    ]
      .sort()
      .join(',')}`;
    return persistentCache(persistKey, PERSIST_TTL, async () => {
      const [rows, roles] = await Promise.all([
        topMembers(api, id).catch(() => undefined),
        projectRoles(slug),
      ]);
      if (!rows) return undefined;
      const min = options?.minWords ?? 100;
      const excluded = new Set(
        options?.excludeUsers?.map((u) => u.toLowerCase()) ?? [],
      );
      return rows
        .filter((r) => r.user.username !== 'REMOVED_USER')
        .filter((r) => !excluded.has(r.user.username.toLowerCase()))
        .filter((r) => Number(r.translated) + Number(r.approved) >= min)
        .map((r) => ({
          username: r.user.username,
          fullName:
            r.user.fullName ??
            ([r.user.firstName, r.user.lastName].filter(Boolean).join(' ') ||
              null),
          avatarUrl: r.user.avatarUrl ?? '',
          translated: Number(r.translated),
          approved: Number(r.approved),
          languages: r.languages ?? [],
          roles: roles.get(r.user.username) ?? [],
          ...joined(r.user.joined),
        }));
    });
  },
  (slug, options) =>
    `${slug}|${options?.minWords ?? ''}|${[...(options?.excludeUsers ?? [])]
      .sort()
      .join(',')}`,
  3_600_000,
);

export function crowdinProjectSlug(url: string | undefined) {
  if (!url) return undefined;
  try {
    return new URL(url).pathname.split('/').filter(Boolean).pop();
  } catch {
    return undefined;
  }
}
