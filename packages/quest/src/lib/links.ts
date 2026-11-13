import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { encodeQuery, withLang } from '@terrafirmagreg-team/translate/lib/url';
import {
  datasetUrlVersion,
  type DatasetRef,
  sectionUrl,
} from '@terrafirmagreg-team/sites/location';

export function questHref(
  dataset: DatasetRef,
  lang: Lang | undefined,
  opts?: { category?: string; id?: string; item?: string; version?: string },
): string {
  const { id } = dataset;
  const version = opts?.version ?? datasetUrlVersion(dataset);
  const base = lang
    ? withLang(sectionUrl('quest', id), lang)
    : sectionUrl('quest', id);
  const [pathname, hash = ''] = base.split('#');
  const [pathOnly, existing = ''] = pathname.split('?');
  const params = new URLSearchParams(existing);
  if (opts?.category) params.set('category', opts.category);
  else params.delete('category');
  if (opts?.id) params.set('id', opts.id);
  else params.delete('id');
  if (opts?.item) params.set('item', opts.item);
  else params.delete('item');
  if (version) params.set('version', version);
  else params.delete('version');
  const q = encodeQuery(params.entries());
  return `${pathOnly}?${q}${hash ? `#${hash}` : ''}`;
}

