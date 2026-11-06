import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { AtlasBundle } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/dto';
import { lookupSpriteInBundle } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/lookup';
import { stackDisplayName } from '@terrafirmagreg-team/game/lib/entry/display';
import { matchGuideEntryKey } from '@terrafirmagreg-team/guide/lib/reference/resolver';
import type { GuideEntryRef } from '@terrafirmagreg-team/guide/types';

export function spriteName(
  dataset: DatasetRef,
  langMap: Record<string, string>,
  atlases: Record<string, AtlasBundle> | undefined,
  id: string,
): string {
  const mod = id.replace(/^#/, '').split(':', 2)[0];
  const langKey =
    mod && !id.startsWith('#')
      ? lookupSpriteInBundle(atlases?.[mod], id)?.sprite.langKey
      : undefined;
  return stackDisplayName(langMap, id, undefined, langKey);
}

export function entryRef(
  refs: Map<string, GuideEntryRef>,
  id: string,
): GuideEntryRef | undefined {
  const key = matchGuideEntryKey(refs.keys(), id);
  return key !== undefined ? refs.get(key) : undefined;
}

export function entryLabel(
  refs: Map<string, GuideEntryRef>,
  langMap: Record<string, string>,
  id: string,
): string {
  return entryRef(refs, id)?.name ?? stackDisplayName(langMap, id);
}

