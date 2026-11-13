import { dumpTextLines } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import type {
  GuideBookJson,
  GuideBookRef,
} from '@terrafirmagreg-team/guide/lib/data/dto';
import type { GuideBook } from '@terrafirmagreg-team/guide/types';
import {
  type FallbackTracker,
  fallbackTracker,
  localize,
  localizeGuideValue,
  markTextKeys,
} from './localize';
import {
  asCover,
  asLanding,
  displayRecord,
  macrosFrom,
  stringField,
  urlSafeSlug,
} from './raw';

function bookName(
  raw: GuideBookJson | undefined,
  ref: GuideBookRef,
  slug: string,
  langMap: Record<string, string>,
  tracker?: FallbackTracker,
): string {
  const display = displayRecord(raw);
  const nameKey = stringField(display, 'name');
  return nameKey
    ? localize(langMap, nameKey, nameKey, tracker)
    : (stringField(raw, 'id') ?? ref.bookId ?? slug);
}

export function toBook(
  raw: GuideBookJson | undefined,
  ref: GuideBookRef,
  slug: string,
  langMap: Record<string, string>,
  missing?: ReadonlySet<string>,
): GuideBook {
  const display = displayRecord(raw);
  const landing = asLanding(display?.landing);
  const tracker = fallbackTracker(missing);
  markTextKeys(landing, tracker);
  return {
    id: stringField(raw, 'id') ?? ref.bookId,
    slug,
    name: bookName(raw, ref, slug, langMap, tracker),
    description: localizeGuideValue(
      stringField(raw, 'subtitle'),
      langMap,
      tracker,
    ) as string | undefined,
    landing,
    landingText: landing.length
      ? dumpTextLines(langMap, landing).join('\n')
      : undefined,
    cover: asCover(raw?.cover),
    macros: macrosFrom(raw),
    ...(tracker?.flag ? { translation: tracker.flag } : {}),
  };
}

export function bookSlug(
  raw: GuideBookJson | undefined,
  ref: GuideBookRef,
): string {
  const explicit = stringField(raw, 'slug');
  if (explicit) return urlSafeSlug(explicit);
  return urlSafeSlug(ref.bookPath);
}

