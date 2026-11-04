import type {
  QuestCompactIndex,
  QuestCompactRow,
} from '@terrafirmagreg-team/quest/lib/data/dto';

const QUEST_SEARCH_MAX = 50;

export function filterCompactQuests(
  index: QuestCompactIndex,
  query: string,
): QuestCompactRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index.quests
    .filter((row) => {
      const hay = [row.search, row.id, row.filename, row.icon, ...row.items]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    })
    .slice(0, QUEST_SEARCH_MAX);
}

