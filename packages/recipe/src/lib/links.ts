import { encodeQueryValue, withLang } from '@terrafirmagreg-team/translate/lib/url';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import {
  type DatasetRef,
  sectionUrl,
} from '@terrafirmagreg-team/sites/location';
import { dumpRelPublicUrl, splitDumpId, tagPseudoId } from '@terrafirmagreg-team/dump/lib/dump/paths';
import type { RecipeHrefOpts, RecipePlace } from '@terrafirmagreg-team/recipe/types';

export type { RecipeHrefOpts, RecipePlace } from '@terrafirmagreg-team/recipe/types';

function recipeQuery(
  entries: Array<readonly [string, string | number | undefined]>,
): string {
  const parts: string[] = [];
  for (const [key, value] of entries) {
    if (value === undefined || value === '') continue;
    parts.push(`${key}=${encodeQueryValue(String(value))}`);
  }
  return parts.join('&');
}

export function recipeBasePath(dataset: DatasetRef): string {
  return sectionUrl('recipe', dataset.id);
}

export const RECIPE_ALL_TYPE = 'all';

export function recipePlaceFromParams(params: {
  get(name: string): string | null;
}): RecipePlace {
  const tool = params.get('tool');
  if (tool === 'calc' || tool === 'forge' || tool === 'alloy') {
    return { kind: tool };
  }
  const type = params.get('type');
  return { kind: 'type', id: type || RECIPE_ALL_TYPE };
}

export function recipePlaceOpts(
  place: RecipePlace | undefined,
): Pick<RecipeHrefOpts, 'type' | 'tool'> {
  if (place?.kind === 'type') {
    return place.id === RECIPE_ALL_TYPE ? {} : { type: place.id };
  }
  return place ? { tool: place.kind } : {};
}

export function recipeHref(
  dataset: DatasetRef,
  lang: Lang | undefined,
  opts?: RecipeHrefOpts,
): string {
  const query = recipeQuery([
    ['type', opts?.type],
    ['tool', opts?.tool],
    ['item', opts?.item],
    ['fluid', opts?.item ? undefined : opts?.fluid],
    ['id', opts?.id],
    ['solo', opts?.id ? opts?.solo : undefined],
    ['relation', opts?.relation],
    ['unit', opts?.tool === 'alloy' ? opts?.unit : undefined],
    ['mix', opts?.tool === 'alloy' ? opts?.mix : undefined],
    ['tab', opts?.tab],
    ['search', opts?.search],
    [
      'rpage',
      opts?.rpage && opts.rpage > 1 ? Math.floor(opts.rpage) : undefined,
    ],
    ['version', dataset.version],
  ]);
  const base = recipeBasePath(dataset);
  const href = query ? `${base}?${query}` : base;
  return lang ? withLang(href, lang) : href;
}

export function recipeCalcHref(
  dataset: DatasetRef,
  lang: Lang | undefined,
  tree?: string,
): string {
  const query = recipeQuery([
    ['tool', 'calc'],
    ['tree', tree],
    ['version', dataset.version],
  ]);
  const href = `${recipeBasePath(dataset)}?${query}`;
  return lang ? withLang(href, lang) : href;
}

export function recipeStackHref(
  dataset: DatasetRef,
  lang: Lang,
  id: string,
  opts?: Pick<RecipeHrefOpts, 'tab' | 'search' | 'relation'> & {
    kind?: 'item' | 'fluid' | 'tag';
    tagKind?: string;
  },
): string {
  const kept = {
    tab: opts?.tab,
    search: opts?.search,
    relation: opts?.relation,
  };
  if (opts?.kind === 'tag' || id.startsWith('#')) {
    const bare = id.startsWith('#') ? id.slice(1) : id;
    const tagKind = opts?.tagKind ?? 'item';
    return recipeHref(dataset, lang, {
      type: 'emi:tag',
      id: tagPseudoId(bare, tagKind),
      ...kept,
    });
  }
  return opts?.kind === 'fluid'
    ? recipeHref(dataset, lang, { fluid: id, ...kept })
    : recipeHref(dataset, lang, { item: id, ...kept });
}

export { recipeImageUrl } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';

export function recipeCardImageUrl(
  dataset: DatasetRef,
  recipeId: string | undefined,
): string | undefined {
  const parts = recipeId ? splitDumpId(recipeId) : undefined;
  if (!parts) return undefined;
  return dumpRelPublicUrl(
    dataset,
    `assets/${parts.ns}/textures/recipe/${parts.path}.webp`,
  );
}

