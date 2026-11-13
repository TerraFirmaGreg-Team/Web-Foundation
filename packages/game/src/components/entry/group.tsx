'use client';
import { datasetCacheKey, type DatasetRef } from '@terrafirmagreg-team/sites/location';

import {
  SPRITE_CLUSTER_INSET,
  SPRITE_CLUSTER_UNITS,
  SpriteCluster,
} from '@terrafirmagreg-team/ui/components/blocks/sprite';
import { EntryIcon, entrySizePx, ENTRY_CYCLE_MS } from '@terrafirmagreg-team/game/components/entry/icon';
import { useCycleIndex } from '@terrafirmagreg-team/ui/hooks/use-cycle-index';
import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { fetchTagMembers } from '@terrafirmagreg-team/game/lib/entry/icon-load';
import {
  classifyRefId,
  isTagKind,
  stackIdFromRef,
  tagKindOf,
  type ReferenceKind,
  type TaggedReference,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { EntrySize } from '@terrafirmagreg-team/game/types/entry';

const GAME_ICON = 12.8;
const STACK_SCALE = 1.15;

function memberRef(
  member: string | TaggedReference,
  kind: ReferenceKind,
): TaggedReference | undefined {
  return typeof member === 'string' ? classifyRefId(member, kind) : member;
}

function memberKey(member: string | TaggedReference, kind: ReferenceKind): string {
  const ref = memberRef(member, kind);
  return ref ? `${ref.kind}:${stackIdFromRef(ref)}` : String(member);
}

async function expandTagRefs(
  refs: readonly TaggedReference[],
  dataset: DatasetRef,
): Promise<TaggedReference[]> {
  const groups = await Promise.all(
    refs.map((ref) =>
      isTagKind(ref.kind)
        ? fetchTagMembers(dataset, ref.id, tagKindOf(ref.kind) ?? 'item')
        : null,
    ),
  );
  const seen = new Set<string>();
  const out: TaggedReference[] = [];
  refs.forEach((ref, i) => {
    const memberIds = groups[i];
    const memberKind = tagKindOf(ref.kind) ?? 'item';
    const expanded: TaggedReference[] = memberIds
      ? memberIds.map((id) => ({ kind: memberKind, id }))
      : [ref];
    for (const member of expanded) {
      const key = `${member.kind}:${stackIdFromRef(member)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(member);
    }
  });
  return out;
}

export const GROUP_CYCLE_MS = ENTRY_CYCLE_MS;

export function EntryGroup({
  members,
  kind = 'item',
  size = 36,
  chip = true,
  dataset,
  limit = 3,
  cycle,
  missing = 'hide',
}: {
  members: readonly (string | TaggedReference)[];
  kind?: ReferenceKind;
  size?: EntrySize;
  chip?: boolean;
  dataset?: DatasetRef;
  limit?: number;
  cycle?: number;
  missing?: 'placeholder' | 'item' | 'hide';
}) {
  const sizePx = entrySizePx(size);
  const references = members
    .map((member) => memberRef(member, kind))
    .filter((ref): ref is TaggedReference => ref !== undefined);
  const expandKey =
    cycle !== undefined &&
    dataset &&
    references.some((ref) => isTagKind(ref.kind))
      ? datasetCacheKey(dataset, references.map((ref) => [ref.kind, stackIdFromRef(ref)]))
      : null;
  const expandedHit = useAsyncResult(
    expandKey
      ? async () => ({
          key: expandKey,
          refs: await expandTagRefs(references, dataset!),
        })
      : false,
    [expandKey, dataset],
  );
  const cycleRefs = !expandKey
    ? references
    : expandedHit.value?.key === expandKey
      ? expandedHit.value.refs
      : references;
  const [index] = useCycleIndex(cycleRefs.length, {
    enabled: cycle !== undefined && cycle > 0,
    intervalMs: cycle,
  });
  if (cycle !== undefined) {
    return (
      <span
        className="relative block"
        style={{ width: sizePx, height: sizePx }}
      >
        {cycleRefs.map((reference, i) => (
          <span
            key={`${reference.kind}:${stackIdFromRef(reference)}`}
            className="absolute inset-0"
            style={{ opacity: i === index ? 1 : 0 }}
            aria-hidden={i !== index}
          >
            <EntryIcon
              reference={reference}
              dataset={dataset}
              size={sizePx}
              missing={missing}
            />
          </span>
        ))}
      </span>
    );
  }
  const scale =
    (sizePx - (chip ? SPRITE_CLUSTER_INSET : 0)) / SPRITE_CLUSTER_UNITS;
  return (
    <SpriteCluster
      size={sizePx}
      chip={chip}
      limit={limit}
      items={members.slice(0, limit).map((member) => (
        <EntryIcon
          key={memberKey(member, kind)}
          reference={memberRef(member, kind)}
          dataset={dataset}
          size={GAME_ICON * STACK_SCALE * scale}
          missing={missing}
        />
      ))}
    />
  );
}
