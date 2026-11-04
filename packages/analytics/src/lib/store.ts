import 'server-only';
import { dbOrm, dbSql, jsonFileStore } from '@terrafirmagreg-team/data';

const FILE = process.env.ANALYTICS_DATA?.trim() || 'data/analytics.json';

const store = jsonFileStore<Record<string, number>>(FILE, () => ({}));

export async function incrementView(key: string): Promise<void> {
  if (await dbOrm()) {
    await dbSql`insert into analytics ("key", views) values (${key}, 1) on conflict ("key") do update set views = views + 1`;
    return;
  }
  const data = store.data;
  data[key] = (data[key] ?? 0) + 1;
  store.save();
}

export async function getView(key: string): Promise<number> {
  const orm = await dbOrm();
  if (orm) {
    const row = await orm.findFirst('analytics', {
      select: ['views'],
      where: (b) => b('key', '=', key),
    });
    return row?.views ?? 0;
  }
  return store.data[key] ?? 0;
}

