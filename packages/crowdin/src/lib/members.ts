import 'server-only';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';

const CROWDIN_ORG = 'terrafirmagreg';
const API = `https://${CROWDIN_ORG}.api.crowdin.com/api/v2`;
const PAGE_SIZE = 500;

export type CrowdinMember = {
  username: string;
  fullName: string | null;
  avatarUrl: string;
  roles?: { name: string }[];
};

async function api<T>(path: string): Promise<T | undefined> {
  const token = process.env.CROWDIN_API_TOKEN;
  if (!token) return undefined;
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  } as RequestInit);
  if (!res.ok) return undefined;
  return (await res.json()) as T;
}

const projectId = createAsyncCache(async (identifier: string) => {
  const res = await api<{
    data: { data: { id: number; identifier: string } }[];
  }>(`/projects?limit=${PAGE_SIZE}`);
  return res?.data.find((p) => p.data.identifier === identifier)?.data.id;
});

export const crowdinMembers = createAsyncCache(
  async (identifier: string): Promise<CrowdinMember[] | undefined> => {
    const id = await projectId(identifier);
    if (id === undefined) return undefined;
    const members: CrowdinMember[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const res = await api<{ data: { data: CrowdinMember }[] }>(
        `/projects/${id}/members?limit=${PAGE_SIZE}&offset=${offset}`,
      );
      const batch = res?.data ?? [];
      members.push(...batch.map((m) => m.data));
      if (batch.length < PAGE_SIZE) break;
    }
    return members;
  },
  (id) => id,
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
