import 'server-only';
import {
  dbOrm,
  dbSql,
  env,
  featureMode,
  jsonFileStore,
} from '@terrafirmagreg-team/data';

const FILE = env('ANALYTICS_DATA') ?? 'data/analytics.json';

const store = jsonFileStore<Record<string, number>>(FILE, () => ({}));

export function analyticsEnabled(): boolean {
  return featureMode('ANALYTICS') !== 'off';
}

export async function incrementView(key: string): Promise<void> {
  const mode = featureMode('ANALYTICS');
  if (mode === 'off') return;
  if (mode === 'prod' && (await dbOrm())) {
    await dbSql`insert into analytics ("key", views) values (${key}, 1) on conflict ("key") do update set views = views + 1`;
    return;
  }
  const data = store.data;
  data[key] = (data[key] ?? 0) + 1;
  store.save();
}

export async function getView(key: string): Promise<number> {
  const mode = featureMode('ANALYTICS');
  if (mode === 'off') return 0;
  const orm = mode === 'prod' ? await dbOrm() : undefined;
  if (orm) {
    const row = await orm.findFirst('analytics', {
      select: ['views'],
      where: (b) => b('key', '=', key),
    });
    return row?.views ?? 0;
  }
  return store.data[key] ?? 0;
}

