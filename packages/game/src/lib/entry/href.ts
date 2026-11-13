import {
  datasetUrlVersion,
  type DatasetRef,
  sectionUrl,
} from '@terrafirmagreg-team/sites/location';
import { encodeQuery, withLang } from '@terrafirmagreg-team/translate/lib/url';
import { tagPseudoId } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { refId, tagKindOf } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { EntryHrefOpts } from '@terrafirmagreg-team/game/types/entry';

export type { EntryHrefOpts } from '@terrafirmagreg-team/game/types/entry';

const query = encodeQuery;

function hrefVersion(dataset: DatasetRef): string | undefined {
  return datasetUrlVersion(dataset);
}

function recipeHref(
  dataset: DatasetRef,
  lang: Lang | undefined,
  opts?: {
    type?: string;
    item?: string;
    fluid?: string;
    id?: string;
    tab?: string;
    search?: string;
    rpage?: number;
    version?: string;
  },
): string {
  const q = query([
    ['type', opts?.type],
    ['item', opts?.item],
    ['fluid', opts?.item ? undefined : opts?.fluid],
    ['id', opts?.id],
    ['tab', opts?.tab],
    ['search', opts?.search],
    ['rpage', opts?.rpage && opts.rpage > 1 ? Math.floor(opts.rpage) : undefined],
    ['version', opts?.version ?? hrefVersion(dataset)],
  ]);
  const base = sectionUrl('recipe', dataset.id);
  const href = q ? `${base}?${q}` : base;
  return lang ? withLang(href, lang) : href;
}

function recipeStackHref(
  dataset: DatasetRef,
  lang: Lang | undefined,
  id: string,
  opts?: Pick<EntryHrefOpts, 'tab' | 'search' | 'version'> & {
    kind?: 'item' | 'fluid' | 'tag';
    tagKind?: string;
  },
): string {
  const kept = { tab: opts?.tab, search: opts?.search, version: opts?.version };
  if (opts?.kind === 'tag' || id.startsWith('#')) {
    const bare = id.startsWith('#') ? id.slice(1) : id;
    return recipeHref(dataset, lang, {
      type: 'emi:tag',
      id: tagPseudoId(bare, opts?.tagKind ?? 'item'),
      ...kept,
    });
  }
  return opts?.kind === 'fluid'
    ? recipeHref(dataset, lang, { fluid: id, ...kept })
    : recipeHref(dataset, lang, { item: id, ...kept });
}

function questHref(
  dataset: DatasetRef,
  lang: Lang | undefined,
  opts?: { category?: string; id?: string; item?: string; version?: string },
): string {
  const q = query([
    ['category', opts?.category],
    ['id', opts?.id],
    ['item', opts?.item],
    ['version', opts?.version ?? hrefVersion(dataset)],
  ]);
  const base = sectionUrl('quest', dataset.id);
  const href = q ? `${base}?${q}` : base;
  return lang ? withLang(href, lang) : href;
}

export function guideHref(
  dataset: DatasetRef,
  lang: Lang | undefined,
  bookId?: string,
  entryId?: string,
  hash?: string,
  categoryId?: string,
  version?: string,
): string {
  const { id } = dataset;
  const q = query([
    ['book', bookId],
    ['entry', entryId],
    ['cat', entryId ? undefined : categoryId],
    ['version', version ?? hrefVersion(dataset)],
  ]);
  const base = `${sectionUrl('guide', id)}${q ? `?${q}` : ''}`;
  const href = hash ? `${base}#${hash}` : base;
  return lang ? withLang(href, lang) : href;
}

export function entryHref(
  dataset: DatasetRef,
  lang: Lang | undefined,
  reference: TaggedReference,
  opts?: EntryHrefOpts,
): string {
  const kept = { tab: opts?.tab, search: opts?.search, version: opts?.version };
  switch (reference.kind) {
    case 'item':
    case 'block':
    case 'entity':
      return recipeStackHref(dataset, lang, refId(reference), { ...kept, kind: 'item' });
    case 'fluid':
      return recipeStackHref(dataset, lang, refId(reference), { ...kept, kind: 'fluid' });
    case 'itemTag':
    case 'blockTag':
    case 'fluidTag':
    case 'entityTag':
      return recipeStackHref(dataset, lang, refId(reference), {
        ...kept,
        kind: 'tag',
        tagKind: tagKindOf(reference.kind),
      });
    case 'texture':
    case 'model':
      return '#';
    case 'recipe':
      return recipeHref(dataset, lang, {
        id: reference.id,
        ...kept,
        rpage: opts?.rpage,
        type: opts?.type,
      });
    case 'quest':
      return questHref(dataset, lang, {
        category: opts?.filename,
        id: reference.id,
        version: opts?.version,
      });
    case 'guide':
    case 'chapter':
      return guideHref(
        dataset,
        lang,
        opts?.modId && opts?.bookPath ? `${opts.modId}:${opts.bookPath}` : undefined,
        opts?.entry ?? reference.id,
        opts?.hash,
        undefined,
        opts?.version,
      );
    default: {
      const _exhaustive: never = reference.kind;
      return _exhaustive;
    }
  }
}

