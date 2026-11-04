'use client';

import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useCycleIndex } from '@terrafirmagreg-team/ui/hooks/use-cycle-index';
import {
  classifyRefId,
  isTagKind,
  parseStackId,
  tagKindOf,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { texturePublicUrl } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import { useDumpLocation } from '@terrafirmagreg-team/game/hooks/use-dump-location';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { lookupSpriteInBundle } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/lookup';
import type { AtlasLookup } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/dto';
import {
  blockItemId,
  fetchAtlases,
  fetchEntityTexture,
  fetchTagMembers,
  peekBlockItem,
  peekEntityTexture,
  peekTagMembers,
} from '@terrafirmagreg-team/game/lib/entry/icon-load';
import { loadClientModAtlases } from '@terrafirmagreg-team/dump/lib/dump/client/atlases';
import { stackKindOf } from '@terrafirmagreg-team/game/lib/entry/icon';
import type {
  DumpNbt,
  ReferenceKind,
  TaggedReference,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

export const ENTRY_CYCLE_MS = 1500;

export type IconSource = {

  rawId: string;

  cycleRef: TaggedReference | null;

  lookup: AtlasLookup | null;

  missingLookup: AtlasLookup | null;
  missingPending: boolean;

  imgSrc: string | undefined;

  sourceKey: string;

  pending: boolean;
  awaitingAtlas: boolean;
  awaitingTexture: boolean;
  usesAtlas: boolean;
  isEntity: boolean;
};

export function useIconSource({
  dataset,
  reference,
  id,
  kind,
  tag,
  missing,
  preferVariant,
  entityView = 'auto',
}: {
  dataset?: DatasetRef;
  reference?: TaggedReference;
  id?: string;
  kind?: ReferenceKind;
  tag?: DumpNbt;
  missing: 'placeholder' | 'item' | 'hide';
  preferVariant?: boolean;
  entityView?: 'auto' | 'texture' | 'egg';
}): IconSource {
  const ref = reference ?? (id ? classifyRefId(id, kind) : undefined);
  const refKind = ref?.kind;
  const rawId = ref?.id ?? id ?? '';
  const nbt = tag ?? ref?.tag;
  const tagMemberKind = tagKindOf(refKind);
  const tagKey =
    dataset && rawId && isTagKind(refKind)
      ? `${dataset.id}/${dataset.version ?? ''}/${tagMemberKind ?? 'item'}/${rawId}`
      : null;
  const tagMembersPeek = tagKey
    ? peekTagMembers(dataset!, rawId, tagMemberKind ?? 'item')
    : undefined;
  const tagHit = useAsyncResult(
    tagKey && tagMembersPeek === undefined
      ? async () => ({
          key: tagKey,
          members: await fetchTagMembers(
            dataset!,
            rawId,
            tagMemberKind ?? 'item',
          ),
        })
      : false,
    [dataset, rawId, tagMemberKind, tagKey, tagMembersPeek],
  );
  const tagMembers = !tagKey
    ? undefined
    : tagMembersPeek !== undefined
      ? tagMembersPeek
      : tagHit.pending
        ? undefined
        : tagHit.value?.key === tagKey
          ? (tagHit.value.members ?? null)
          : null;
  const cycleRefs =
    tagMembers && tagMembers.length > 1
      ? tagMembers.map((member) => ({
          kind: (tagMemberKind ?? 'item') as ReferenceKind,
          id: member,
        }))
      : null;
  const [cycleIndex] = useCycleIndex(cycleRefs?.length ?? 0, {
    enabled: cycleRefs !== null,
    intervalMs: ENTRY_CYCLE_MS,
  });
  const itemId = !rawId
    ? ''
    : tagKey
      ? tagMembers === undefined
        ? undefined
        : tagMembers === null
          ? null
          : (tagMembers[0] ?? null)
      : rawId;
  const memberKind =
    isTagKind(refKind) && itemId && !itemId.startsWith('#')
      ? (tagMemberKind ?? 'item')
      : refKind;
  const blockKey =
    dataset && memberKind === 'block' && itemId && !itemId.startsWith('#')
      ? `${dataset.id}/${dataset.version ?? ''}/${itemId}`
      : null;
  const blockPeek = blockKey ? peekBlockItem(dataset!, itemId!) : undefined;
  const blockHit = useAsyncResult(
    blockKey && blockPeek === undefined
      ? async () => ({
          key: blockKey,
          id: await blockItemId(dataset!, itemId!),
        })
      : false,
    [dataset, itemId, blockKey, blockPeek],
  );
  const blockResolved = !blockKey
    ? undefined
    : blockPeek !== undefined
      ? blockPeek
      : blockHit.pending
        ? undefined
        : blockHit.value?.key === blockKey
          ? (blockHit.value.id ?? null)
          : null;
  const atlasId = blockKey ? (blockResolved ?? undefined) : itemId;
  const displayKind = blockKey && blockResolved ? 'item' : memberKind;
  const resolvedId = atlasId ?? rawId;
  const isTexture = displayKind === 'texture';
  const isEntity = displayKind === 'entity';
  const parsed = parseStackId(resolvedId.replace(/^#/, ''));
  const spriteId = parsed.id;
  const eggId =
    isEntity && entityView !== 'texture' && spriteId && !spriteId.startsWith('#')
      ? `${spriteId}_spawn_egg`
      : undefined;
  const usesAtlas =
    Boolean(dataset && rawId) &&
    (displayKind === 'item' ||
      displayKind === 'block' ||
      displayKind === 'fluid' ||
      Boolean(eggId));
  const modId = spriteId.includes(':')
    ? spriteId.slice(0, spriteId.indexOf(':'))
    : '';
  const atlasNeedsLoad =
    dataset && usesAtlas && modId && spriteId && !spriteId.startsWith('#');
  const atlasPeek = atlasNeedsLoad
    ? loadClientModAtlases.peek(dataset, modId)
    : undefined;
  const atlasBundle =
    atlasPeek && (atlasPeek.items || atlasPeek.blocks) ? atlasPeek : null;
  const atlases = useAsyncResult(
    atlasNeedsLoad && atlasPeek === undefined
      ? () => fetchAtlases(dataset, modId)
      : false,
    [atlasNeedsLoad, atlasPeek, dataset, modId],
  );
  const atlasValue = atlasPeek === undefined ? atlases.value : atlasBundle;
  const sourceKey = `${dataset?.id}/${dataset?.version ?? ''}:${displayKind}:${resolvedId}`;
  const dumpLoc = useDumpLocation(dataset);
  const wantEntityTexture = isEntity && entityView !== 'egg';
  const texturePeek =
    dataset && isTexture && rawId
      ? texturePublicUrl(dataset, rawId)
      : dataset && wantEntityTexture && resolvedId
        ? peekEntityTexture(dataset, resolvedId, nbt)
        : null;
  const textureSrc = useAsyncResult(
    dataset && isTexture && rawId
      ? false
      : dataset &&
            wantEntityTexture &&
            resolvedId &&
            texturePeek === undefined
        ? async () => ({
            key: sourceKey,
            url:
              (await fetchEntityTexture(dataset, resolvedId, nbt)) ?? undefined,
          })
        : false,
    [
      isTexture,
      isEntity,
      wantEntityTexture,
      dataset,
      rawId,
      resolvedId,
      sourceKey,
      nbt,
      texturePeek,
    ],
  );
  const resolvedTexture =
    texturePeek !== undefined
      ? (texturePeek ?? undefined)
      : textureSrc.value?.key === sourceKey
        ? textureSrc.value.url
        : undefined;
  const wantMissingItem =
    missing === 'item' && dataset !== undefined && usesAtlas;
  const missingPeek = wantMissingItem
    ? loadClientModAtlases.peek(dataset, 'ftbquests')
    : undefined;
  const missingBundleValue =
    missingPeek !== undefined
      ? missingPeek.items || missingPeek.blocks
        ? missingPeek
        : null
      : undefined;
  const missingBundle = useAsyncResult(
    wantMissingItem && missingPeek === undefined
      ? () => fetchAtlases(dataset, 'ftbquests')
      : false,
    [wantMissingItem, missingPeek, dataset],
  );
  const missingLookup = wantMissingItem
    ? lookupSpriteInBundle(
        missingBundleValue === undefined
          ? missingBundle.value
          : missingBundleValue,
        {
          id: 'ftbquests:missing_item',
          kind: 'item',
        },
      )
    : null;

  const lookupKind = stackKindOf(displayKind) ?? (eggId ? 'item' : undefined);
  const lookup = usesAtlas
    ? lookupSpriteInBundle(
        atlasValue,
        {
          id: eggId ?? spriteId,
          ...(lookupKind ? { kind: lookupKind } : {}),
          ...(nbt !== undefined
            ? { tag: nbt }
            : parsed.nbt !== undefined
              ? { tag: parsed.nbt }
              : {}),
        },
        lookupKind,
        preferVariant,
      )
    : null;
  const pending =
    (isTagKind(refKind) && itemId === undefined) ||
    (blockKey !== null && blockResolved === undefined);
  const awaitingAtlas =
    usesAtlas &&
    atlasId != null &&
    !atlasId.startsWith('#') &&
    atlases.pending;
  const awaitingTexture =
    (isTexture || isEntity) &&
    texturePeek === undefined &&
    (textureSrc.pending || (isTexture && !dumpLoc));

  return {
    rawId,
    cycleRef:
      cycleRefs && !pending ? (cycleRefs[cycleIndex] ?? cycleRefs[0]!) : null,
    lookup: lookup ?? null,
    missingLookup: missingLookup ?? null,
    missingPending: missingBundle.pending,
    imgSrc: isTexture || isEntity ? resolvedTexture : undefined,
    sourceKey,
    pending,
    awaitingAtlas,
    awaitingTexture,
    usesAtlas,
    isEntity,
  };
}

