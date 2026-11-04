import type { QuestCompactIndex } from '@terrafirmagreg-team/quest/lib/data/dto';

export type QuestChapterRow = QuestCompactIndex['chapters'][number];

export type QuestChapterGroup = {
  id: string;
  title?: string;
  chapters: QuestChapterRow[];
};

export function groupQuestChapters(
  index: QuestCompactIndex,
): QuestChapterGroup[] {
  const position = new Map(index.chapters.map((chapter, i) => [chapter, i]));
  const byGroup = new Map<string, QuestChapterRow[]>();
  for (const chapter of index.chapters) {
    const group = chapter.group ?? '';
    const list = byGroup.get(group);
    if (list) list.push(chapter);
    else byGroup.set(group, [chapter]);
  }
  const ordered = (list: QuestChapterRow[]) =>
    [...list].sort(
      (a, b) =>
        (a.orderIndex ?? Number.MAX_SAFE_INTEGER) -
          (b.orderIndex ?? Number.MAX_SAFE_INTEGER) ||
        (position.get(a) ?? 0) - (position.get(b) ?? 0),
    );

  const out: QuestChapterGroup[] = [];
  const leftover = [...byGroup.keys()]
    .filter((id) => !index.groups.some((g) => g.id === id))
    .flatMap((id) => byGroup.get(id) ?? []);
  if (leftover.length) out.push({ id: '', chapters: ordered(leftover) });
  for (const group of index.groups) {
    const chapters = byGroup.get(group.id);
    if (!chapters?.length) continue;
    out.push({ id: group.id, title: group.title, chapters: ordered(chapters) });
  }
  return out;
}

