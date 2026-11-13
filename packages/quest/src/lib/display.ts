import { humanizeKey, langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { stackDisplayName } from '@terrafirmagreg-team/game/lib/entry/display';
import {
  classifyRefId,
  stackIdBase,
  stackIdFromRef,
  type TaggedReference,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { questFromCompact } from '@terrafirmagreg-team/quest/lib/data/parse';
import { parseFilterRefs } from '@terrafirmagreg-team/quest/lib/data/filter';
import type {
  Quest,
  QuestCompactRow,
  QuestReward,
  QuestTask,
} from '@terrafirmagreg-team/quest/lib/data/dto';

export function taskDisplayTitle(
  task: QuestTask,
  map: Record<string, string>,
): string {
  if (task.title) return langString(map, task.title) ?? task.title;
  const ref = questTaskIconRef(task);
  if (ref) {
    const name = stackDisplayName(map, stackIdFromRef(ref), ref.kind);
    return task.count && task.count > 1 ? `${task.count}× ${name}` : name;
  }
  return (
    langString(map, `ftbquests.task.${task.type}`) ?? humanizeKey(task.type)
  );
}

function isEmptyQuestIcon(id: string | undefined): boolean {
  if (!id) return true;
  const bare = stackIdBase(id).replace(/^#+/, '').trim();
  return bare === 'minecraft:air' || bare === 'air';
}

export function questTaskIconRefsOfTask(task: QuestTask): TaggedReference[] {
  if (task.icon && !isEmptyQuestIcon(task.icon)) {
    const icon = classifyRefId(task.icon, task.iconKind);
    if (icon) return [icon];
  }
  const out: TaggedReference[] = [];
  for (const item of task.items) {
    if (isEmptyQuestIcon(item)) continue;
    const ref = classifyRefId(item);
    if (ref) out.push(ref);
  }
  for (const item of task.filterItems ?? []) {
    if (isEmptyQuestIcon(item)) continue;
    const ref = classifyRefId(item);
    if (ref) out.push(ref);
  }
  if (task.filter) out.push(...parseFilterRefs(task.filter));
  if (!out.length && task.ref) out.push(task.ref);
  return out;
}

export function questTaskIconRef(task: QuestTask): TaggedReference | undefined {
  return questTaskIconRefsOfTask(task)[0];
}

function iconRefKey(ref: TaggedReference): string {
  return `${ref.kind}:${stackIdFromRef(ref)}`;
}

export function questIconRef(
  quest: Pick<Quest, 'icon' | 'iconKind'>,
): TaggedReference | undefined {
  if (!quest.icon || isEmptyQuestIcon(quest.icon)) return undefined;
  return classifyRefId(quest.icon, quest.iconKind);
}

export function questTaskIconRefs(
  quest: Pick<Quest, 'icon' | 'iconKind' | 'tasks'>,
): TaggedReference[] {
  const explicit = questIconRef(quest);
  if (explicit) return [explicit];
  const seen = new Set<string>();
  const unique: TaggedReference[] = [];
  for (const task of quest.tasks) {
    for (const ref of questTaskIconRefsOfTask(task)) {
      const key = iconRefKey(ref);
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(ref);
    }
  }
  return unique;
}

export function questDisplayTitle(
  quest: Quest,
  map: Record<string, string>,
): string {
  if (quest.title) return langString(map, quest.title) ?? quest.title;
  const first = quest.tasks[0];
  if (first) return taskDisplayTitle(first, map);
  return langString(map, 'ftbquests.unnamed') ?? 'Unnamed';
}

export function compactRowDisplayTitle(
  row: QuestCompactRow,
  map: Record<string, string>,
): string {
  return questDisplayTitle(questFromCompact(row), map);
}

export function rewardDisplayTitle(
  reward: QuestReward,
  map: Record<string, string>,
): string {
  if (reward.title) return langString(map, reward.title) ?? reward.title;
  if (reward.type === 'item' && reward.items.length) {
    const count = reward.count && reward.count > 1 ? `${reward.count}× ` : '';
    return `${count}${reward.items
      .map((id) => stackDisplayName(map, id))
      .join(', ')}`;
  }
  if (reward.type === 'xp') {
    return reward.xp != null && reward.xp > 0 ? `${reward.xp} XP` : 'XP';
  }
  return reward.type;
}

export function parseGuidePageRef(
  guidePage: string,
): { modId: string; bookPath: string; entry: string } | undefined {
  const parts = guidePage.trim().split(/\s+/);
  if (parts.length < 2) return undefined;
  const book = parts[0]!;
  const pageRef = parts[1]!;
  const bookColon = book.indexOf(':');
  if (bookColon <= 0) return undefined;
  const modId = book.slice(0, bookColon);
  const bookPath = book.slice(bookColon + 1);
  const pageColon = pageRef.indexOf(':');
  const entry = pageColon >= 0 ? pageRef.slice(pageColon + 1) : pageRef;
  if (!modId || !bookPath || !entry) return undefined;
  return { modId, bookPath, entry };
}

export function visibleRewards(
  rewards: QuestReward[],
  langMap: Record<string, string>,
): QuestReward[] {
  const chipNames = new Set(
    rewards.flatMap((reward) =>
      reward.items.map((id) => stackDisplayName(langMap, id)),
    ),
  );
  return rewards.filter((reward) => {
    if (reward.items.length) return true;
    return !chipNames.has(rewardDisplayTitle(reward, langMap));
  });
}

