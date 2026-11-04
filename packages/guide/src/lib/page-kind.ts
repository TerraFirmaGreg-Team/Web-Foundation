import type { GuidePage } from '@terrafirmagreg-team/guide/types';
import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';

export type PageKind =
  | 'empty'
  | 'text'
  | 'image'
  | 'recipe'
  | 'spotlight'
  | 'entity'
  | 'multiblock'
  | 'multimultiblock'
  | 'link'
  | 'relations'
  | 'quest'
  | 'table'
  | 'unknown';

const RECIPE_TYPES = new Set([
  'recipe',
  'crafting',
  'smelting',
  'blasting',
  'smoking',
  'campfire',
  'smithing',
  'stonecutting',
  'knapping',
  'anvil',
  'welding',
  'barrel',
  'quern',
  'loom',
  'heat',
  'drying',
  'glassworking',
]);

export function classify(type: string | undefined): PageKind {
  const raw = (type ?? '').toLowerCase().trim();
  const value = raw.includes(':') ? raw.slice(raw.indexOf(':') + 1) : raw;
  if (!value || value === 'text') return 'text';
  if (value === 'empty') return 'empty';
  if (value === 'image') return 'image';
  if (value === 'spotlight') return 'spotlight';
  if (value === 'entity') return 'entity';
  if (value === 'multiblock') return 'multiblock';
  if (value === 'multimultiblock') return 'multimultiblock';
  if (value === 'link') return 'link';
  if (value === 'relations') return 'relations';
  if (value === 'quest') return 'quest';
  if (value === 'table' || value === 'table_small') return 'table';
  if (value.endsWith('_recipe') || RECIPE_TYPES.has(value)) return 'recipe';
  return 'unknown';
}

export function pageTexts(page: GuidePage): string[] {
  if (Array.isArray(page.texts)) {
    return page.texts.filter(
      (text): text is string => typeof text === 'string' && Boolean(text),
    );
  }
  return typeof page.text === 'string' && page.text ? [page.text] : [];
}

const INDEX_BULLET = /\$\(li\d*\)/;
const INDEX_BULLET_ALL = /\$\(li\d*\)/g;
const MACRO = /\$\([^)]*\)/g;
const INDEX_LABEL_MAX = 48;

function linkListOnly(text: string): boolean {
  if (!INDEX_BULLET.test(text)) return false;
  const items = text.split(INDEX_BULLET_ALL);
  const head = (items[0] ?? '').replace(MACRO, '').trim();
  if (head) return false;
  const entries = items.slice(1).filter((item) => item.trim());
  return (
    entries.length > 0 &&
    entries.every((item) => {
      const plain = item.replace(MACRO, '').trim();
      return (
        plain.length <= INDEX_LABEL_MAX &&
        (item.includes('$(l:') ||
          item.includes('$(url:') ||
          !/[.!?]/.test(plain))
      );
    })
  );
}

export function isIndexPage(
  page: {
    anchor?: unknown;
    type?: unknown;
    text?: unknown;
    texts?: unknown;
  },
  langMap: Record<string, string> = {},
): boolean {
  if (page.anchor === 'index') return true;
  if (classify(typeof page.type === 'string' ? page.type : undefined) !== 'text') {
    return false;
  }
  const rawTexts = Array.isArray(page.texts)
    ? page.texts
    : typeof page.text === 'string'
      ? [page.text]
      : [];
  const texts = rawTexts.filter(
    (text): text is string => typeof text === 'string' && Boolean(text),
  );
  if (!texts.length) return false;
  return texts.every((raw) => {
    const text = langString(langMap, raw) ?? raw;
    return linkListOnly(text);
  });
}

