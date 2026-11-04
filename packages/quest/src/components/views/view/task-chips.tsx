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
  const stackRefs = filterRefs.filter((ref) => !isTagKind(ref.kind));
  const tagSet = new Set(tagRefs.map((ref) => tagHashId(ref.id)));
  const stackIds = new Set(stackRefs.map(stackIdFromRef));
  const itemChips = [...new Set(task.items)].filter(
    (id) => !stackIds.has(id) && isItemChipId(id, tagSet),
  );
  const inlineTags = task.items.filter(
    (id) => id.startsWith('#') && !tagSet.has(id),
  );
  const typeIcon = questTaskIconRef(task);
  const chipIcon = typeIcon ?? fallbackIcon;
  const coveredIds = new Set<string>([
    ...itemChips,
    ...inlineTags,
    ...stackRefs.map(stackIdFromRef),
    ...tagRefs.map((ref) => tagHashId(ref.id)),
  ]);
  const iconId = chipIcon ? stackIdFromRef(chipIcon) : undefined;
  const showTypeIcon =
    chipIcon != null && iconId != null && !coveredIds.has(iconId);
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
          size="lg"
          variant="chip"
          missing="item"
        />
      ))}
      {stackRefs.map((ref) => (
        <Entry
          key={`${ref.kind}:${stackIdFromRef(ref)}`}
          reference={ref}
          size="lg"
          variant="chip"
          missing="item"
        />
      ))}
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

