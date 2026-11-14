'use client';

import {
  questTaskIconRef,
  taskDisplayTitle,
} from '@terrafirmagreg-team/quest/lib/display';
import { parseFilterRefs } from '@terrafirmagreg-team/quest/lib/data/filter';
import {
  isTagKind,
  stackIdFromRef,
  type TaggedReference,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { tagHashId } from '@terrafirmagreg-team/dump/lib/dump/paths';
import type { QuestTask } from '@terrafirmagreg-team/quest/lib/data/dto';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { isItemChipId } from '@terrafirmagreg-team/quest/lib/task';

export function TaskChips({
  langMap,
  task,
  fallbackIcon,
}: {
  langMap: Record<string, string>;
  task: QuestTask;
  fallbackIcon?: TaggedReference;
}) {
  const title = taskDisplayTitle(task, langMap);
  const filterRefs = task.filter ? parseFilterRefs(task.filter) : [];
  const tagRefs = filterRefs.filter((ref) => isTagKind(ref.kind));
  const stackIds = new Set(
    filterRefs.filter((ref) => !isTagKind(ref.kind)).map(stackIdFromRef),
  );
  const tagSet = new Set(tagRefs.map((ref) => tagHashId(ref.id)));
  const cycleIds = [
    ...new Set([...stackIds, ...(task.filterItems ?? [])]),
  ].filter((id) => isItemChipId(id, tagSet));
  const itemChips = [...new Set(task.items)].filter(
    (id) =>
      !id.startsWith('ftbfiltersystem:') &&
      !stackIds.has(id) &&
      !cycleIds.includes(id) &&
      isItemChipId(id, tagSet),
  );
  const inlineTags = task.items.filter(
    (id) => id.startsWith('#') && !tagSet.has(id),
  );
  const typeIcon = questTaskIconRef(task);
  const chipIcon = typeIcon ?? fallbackIcon;
  const coveredIds = new Set<string>([
    ...itemChips,
    ...inlineTags,
    ...cycleIds,
    ...tagRefs.map((ref) => tagHashId(ref.id)),
  ]);
  const iconId = chipIcon ? stackIdFromRef(chipIcon) : undefined;
  const showTypeIcon =
    chipIcon != null &&
    iconId != null &&
    !coveredIds.has(iconId) &&
    (!iconId.startsWith('ftbfiltersystem:') ||
      (!cycleIds.length && !tagRefs.length));
  return (
    <>
      {showTypeIcon && chipIcon ? (
        <Entry
          reference={chipIcon}
          name={title}
          size="lg"
          variant="chip"
          missing="item"
        />
      ) : null}
      {[
        ...tagRefs,
        ...inlineTags.map((id) => ({
          kind: 'itemTag' as const,
          id: id.slice(1),
        })),
      ].map((ref) => (
        <Entry
          key={tagHashId(ref.id)}
          reference={ref}
          name={`#${ref.id}`}
          badge={
            <span
              aria-hidden
              className="font-mc leading-none text-amber-300"
              style={{
                fontSize: 12,
                textShadow: '1.5px 1.5px 0 var(--color-mc-arrow)',
              }}
            >
              #
            </span>
          }
          badgeClassName="top-0 left-0 right-auto bottom-auto"
          size="lg"
          variant="chip"
          missing="item"
        />
      ))}
      {cycleIds.length ? (
        <Entry
          key={`filter:${task.id}`}
          id={cycleIds[0]}
          kind="item"
          name={title}
          members={cycleIds}
          size="lg"
          variant="chip"
          missing="item"
        />
      ) : null}
      {itemChips.map((id) => (
        <Entry
          key={id}
          id={id}
          kind="item"
          size="lg"
          variant="chip"
          missing="item"
        />
      ))}
    </>
  );
}
