import 'server-only';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { createHash } from 'node:crypto';
import { dbOrm, jsonFileStore } from '@terrafirmagreg-team/data';

const FILE = process.env.SHARE_DATA?.trim() || 'data/shares.json';
const MAX_TREE_LEN = 200_000;
const TTL_DAYS = Number(process.env.SHARE_TTL_DAYS ?? 365) || 0;

const store = jsonFileStore<Record<string, { tree: string; created: number }>>(
  FILE,
  () => ({}),
);

function scopeKey(section: string, dataset: DatasetRef, id: string): string {
  return `${section}:${dataset.id}:${dataset.version ?? ''}:${id}`;
}

function alive(created: number): boolean {
  return TTL_DAYS <= 0 || created + TTL_DAYS * 86_400_000 > Date.now();
}

export async function putShare(
  section: string,
  dataset: DatasetRef,
  tree: string,
): Promise<string | null> {
  if (!tree || tree.length > MAX_TREE_LEN) return null;
  const id = createHash('sha256')
    .update(scopeKey(section, dataset, tree))
    .digest('base64url')
    .slice(0, 10);
  const key = scopeKey(section, dataset, id);
  const orm = await dbOrm();
  if (orm) {
    const created = Date.now();
    await orm.upsert('shares', {
      where: (b) => b('scope', '=', key),
      create: { scope: key, tree, created },
      update: { tree, created },
    });
    return id;
  }
  const data = store.data;
  if (data[key]?.tree !== tree) {
    data[key] = { tree, created: Date.now() };
    store.save();
  }
  return id;
}

export async function getShare(
  section: string,
  dataset: DatasetRef,
  id: string,
): Promise<string | undefined> {
  const orm = await dbOrm();
  if (orm) {
    const row =
      (await orm.findFirst('shares', {
        select: ['tree', 'created'],
        where: (b) => b('scope', '=', scopeKey(section, dataset, id)),
      })) ??
      (await orm.findMany('shares', {
        select: ['tree', 'created'],
        where: (b) =>
          b.and(
            b('scope', 'starts with', `${section}:`),
            b('scope', 'ends with', `:${id}`),
          ),
        orderBy: [['created', 'desc']],
        limit: 1,
      }))[0];
    return row && alive(row.created) ? row.tree : undefined;
  }
  const data = store.data;
  const row =
    data[scopeKey(section, dataset, id)] ??
    Object.entries(data)
      .filter(
        ([key]) =>
          key.startsWith(`${section}:`) && key.endsWith(`:${id}`),
      )
      .map(([, value]) => value)
      .sort((a, b) => b.created - a.created)[0];
  return row && alive(row.created) ? row.tree : undefined;
}

