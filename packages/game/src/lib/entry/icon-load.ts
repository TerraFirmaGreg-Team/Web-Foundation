import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { AtlasBundle } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/dto';
import {
  clientDumpJson,
  clientRegistryDataFileRel,
  clientTagFileRel,
} from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { loadClientModAtlases } from '@terrafirmagreg-team/dump/lib/dump/client/atlases';
import { dumpRelPublicUrl, matchTagIndexKey } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { modelPublicUrl } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import { lookupSpriteInBundle } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/lookup';
import { asIdTable, asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { asTaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { asEntry, matchVariant } from '@terrafirmagreg-team/dump/lib/dump/data/registry/parse';
import type { DumpEntityEntry } from '@terrafirmagreg-team/dump/lib/dump/data/registry/dto';
import { asTag, firstTagItem } from '@terrafirmagreg-team/dump/lib/dump/data/tag/parse';
import type { DumpNbt } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { DumpTag } from '@terrafirmagreg-team/dump/lib/dump/data/tag/dto';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

export type { AtlasBundle } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/dto';

type TagMemberKind = 'item' | 'block' | 'fluid' | 'entity';

const TAG_MEMBER_REGISTRY: Record<TagMemberKind, string> = {
  item: 'items',
  block: 'blocks',
  fluid: 'fluids',
  entity: 'entities',
};

export function fetchAtlases(
  dataset: DatasetRef,
  modId: string,
): Promise<AtlasBundle | null> {
  return loadClientModAtlases(dataset, modId).then((bundle) =>
    bundle.items || bundle.blocks ? bundle : null,
  );
}

const fetchTagRecord = createDatasetCache(
  async (dataset: DatasetRef, tagId: string, memberKind: TagMemberKind) => {
    const rel = await clientTagFileRel(dataset, tagId);
    const entries = asRecord(await clientDumpJson(dataset, rel, 'high'));
    if (!entries) return undefined;
    const entryKey = matchTagIndexKey(
      entries,
      tagId,
      TAG_MEMBER_REGISTRY[memberKind],
    );
    return entryKey !== undefined
      ? asTag(entries[entryKey], entryKey, asIdTable(entries))
      : undefined;
  },
);

export function fetchTagItem(
  dataset: DatasetRef,
  tagId: string,
  memberKind: TagMemberKind,
): Promise<string | null> {
  return fetchTagRecord(dataset, tagId, memberKind).then(
    (tag: DumpTag | undefined) => firstTagItem(tag) ?? null,
  );
}

const TAG_ICON_MEMBER_LIMIT = 16;

const TAG_ICON_SPRITE_KIND: Record<TagMemberKind, 'item' | 'fluid'> = {
  item: 'item',
  block: 'item',
  fluid: 'fluid',
  entity: 'item',
};

const fetchTagMembersList = createDatasetCache(
  async (
    dataset: DatasetRef,
    tagId: string,
    memberKind: TagMemberKind,
  ): Promise<string[]> => {
    const tag = await fetchTagRecord(dataset, tagId, memberKind);
    const members = (tag?.members ?? [])
      .filter((member) => member && !member.startsWith('#'))
      .slice(0, TAG_ICON_MEMBER_LIMIT);
    if (!members.length) return [];
    if (memberKind !== 'item' && memberKind !== 'block' && memberKind !== 'fluid') {
      return members;
    }
    const spriteKind = TAG_ICON_SPRITE_KIND[memberKind];
    const out: string[] = [];
    for (const member of members) {
      const itemId =
        memberKind === 'block'
          ? await fetchBlockItem(dataset, member)
          : member;
      const ns = itemId.split(':', 1)[0];
      const bundle = ns ? await fetchAtlases(dataset, ns) : null;
      if (lookupSpriteInBundle(bundle, { id: itemId, kind: spriteKind })) {
        out.push(member);
      }
    }
    return out.length ? out : [members[0]];
  },
);

export function fetchTagMembers(
  dataset: DatasetRef,
  tagId: string,
  memberKind: TagMemberKind,
): Promise<string[]> {
  return fetchTagMembersList(dataset, tagId, memberKind);
}

const fetchBlockItem = createDatasetCache(
  async (dataset: DatasetRef, blockId: string): Promise<string> => {
    const ns = blockId.split(':', 1)[0];
    const rel = ns
      ? await clientRegistryDataFileRel(dataset, ns, 'blocks')
      : undefined;
    const entries = rel
      ? asRecord(await clientDumpJson(dataset, rel, 'high'))
      : undefined;
    const row = entries ? asRecord(entries[blockId]) : undefined;
    const itemRef = row ? asTaggedReference(row.item) : undefined;
    return asString(itemRef?.id) ?? blockId;
  },
);

export function blockItemId(
  dataset: DatasetRef,
  blockId: string,
): Promise<string> {
  return fetchBlockItem(dataset, blockId);
}

const fetchEntity = createDatasetCache(async (dataset: DatasetRef, id: string) => {
  const ns = id.split(':', 1)[0];
  const rel = ns
    ? await clientRegistryDataFileRel(dataset, ns, 'entities')
    : undefined;
  const entries = rel
    ? asRecord(await clientDumpJson(dataset, rel, 'high'))
    : undefined;
  const raw = entries?.[id];
  if (raw === undefined) return undefined;
  const parsed = asEntry(raw, 'entities', id, asIdTable(entries ?? {}));
  return parsed as DumpEntityEntry | undefined;
});

export async function fetchEntityTexture(
  dataset: DatasetRef,
  id: string,
  nbt?: DumpNbt,
): Promise<string | null> {
  const entity = await fetchEntity(dataset, id);
  return entityTextureUrl(dataset, entity, id, nbt);
}

export function peekEntityTexture(
  dataset: DatasetRef,
  id: string,
  nbt?: DumpNbt,
): string | null | undefined {
  const entity = fetchEntity.peek(dataset, id);
  return entity === undefined
    ? undefined
    : entityTextureUrl(dataset, entity, id, nbt);
}

export async function fetchEntityModel(
  dataset: DatasetRef,
  id: string,
  nbt?: DumpNbt,
): Promise<string | null> {
  const entity = await fetchEntity(dataset, id);
  return entityModelUrl(dataset, entity, id, nbt);
}

export function peekEntityModel(
  dataset: DatasetRef,
  id: string,
  nbt?: DumpNbt,
): string | null | undefined {
  const entity = fetchEntity.peek(dataset, id);
  return entity === undefined
    ? undefined
    : entityModelUrl(dataset, entity, id, nbt);
}

function entityModelUrl(
  dataset: DatasetRef,
  entity: DumpEntityEntry | undefined,
  id: string,
  nbt?: DumpNbt,
): string | null {
  if (!entity) return null;
  const model = matchVariant(entity.variants, nbt)?.model ?? entity.model;
  if (!model) return null;
  const ns = id.split(':', 1)[0];
  return modelPublicUrl(dataset, ns, model) ?? null;
}

export function peekTagMembers(
  dataset: DatasetRef,
  tagId: string,
  memberKind: TagMemberKind,
): string[] | undefined {
  return fetchTagMembersList.peek(dataset, tagId, memberKind);
}

export function peekBlockItem(
  dataset: DatasetRef,
  blockId: string,
): string | undefined {
  return fetchBlockItem.peek(dataset, blockId);
}

function entityTextureUrl(
  dataset: DatasetRef,
  entity: DumpEntityEntry | undefined,
  id: string,
  nbt?: DumpNbt,
): string | null {
  if (!entity) return null;
  const texture = matchVariant(entity.variants, nbt)?.texture ?? entity.texture;
  if (!texture) return null;
  const ns = id.split(':', 1)[0];
  return dumpRelPublicUrl(dataset, `assets/${ns}/${texture}`) ?? null;
}

