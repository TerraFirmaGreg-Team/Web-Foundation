import type {
  Quest,
  QuestCompactIndex,
  QuestCompactRow,
} from '@terrafirmagreg-team/quest/lib/data/dto';

function questItems(quest: Quest): string[] {
  const out = [
    ...(quest.icon ? [quest.icon] : []),
    ...quest.tasks.flatMap((task) => task.items),
    ...quest.rewards.flatMap((reward) => reward.items),
  ];
  return [...new Set(out)];
}

export function isQuestVisibleOnMap(quest: Pick<Quest, 'invisible'>): boolean {
  return quest.invisible !== true;
}

export function questFromCompact(row: QuestCompactRow): Quest {
  return {
    id: row.id,
    x: 0,
    y: 0,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    icon: row.icon,
    iconKind: row.iconKind,
    dependencies: row.dependencies ?? [],
    tasks: row.tasks ?? [],
    rewards: row.rewards ?? [],
    guidePage: row.guidePage,
    optional: row.optional,
    invisible: row.invisible,
    hideDependencyLines: row.hideDependencyLines,
    hideDependentLines: row.hideDependentLines,
  };
}

const COMPACT_BY_ID = new WeakMap<
  QuestCompactIndex,
  Map<string, QuestCompactRow>
>();

function compactById(index: QuestCompactIndex): Map<string, QuestCompactRow> {
  let byId = COMPACT_BY_ID.get(index);
  if (!byId) {
    byId = new Map(index.quests.map((row) => [row.id, row]));
    COMPACT_BY_ID.set(index, byId);
  }
  return byId;
}

export function compactPrereqs(
  dependencies: string[],
  index: QuestCompactIndex,
): QuestCompactRow[] {
  const byId = compactById(index);
  return dependencies.flatMap((id) => {
    const row = byId.get(id);
    if (!row || row.invisible) return [];
    return [row];
  });
}

export function compactDependents(
  questId: string,
  index: QuestCompactIndex,
): QuestCompactRow[] {
  return index.quests.filter(
    (row) => !row.invisible && row.dependencies.includes(questId),
  );
}

export function compactRowFromQuest(
  quest: Quest,
  filename: string,
): QuestCompactRow {
  return {
    id: quest.id,
    filename,
    title: quest.title,
    subtitle: quest.subtitle,
    description: quest.description,
    icon: quest.icon,
    iconKind: quest.iconKind,
    items: questItems(quest),
    dependencies: quest.dependencies,
    invisible: quest.invisible,
    optional: quest.optional,
    hideDependencyLines: quest.hideDependencyLines,
    hideDependentLines: quest.hideDependentLines,
    guidePage: quest.guidePage,
    tasks: quest.tasks,
    rewards: quest.rewards,
  };
}

