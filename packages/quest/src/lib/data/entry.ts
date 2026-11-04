import { isQuestVisibleOnMap } from '@terrafirmagreg-team/quest/lib/data/parse';
import type { Chapter } from '@terrafirmagreg-team/quest/lib/data/dto';

export function chapterEntryQuestId(chapter: Chapter): string | undefined {
  const visible = chapter.quests.filter(isQuestVisibleOnMap);
  if (
    chapter.autofocusId &&
    visible.some((quest) => quest.id === chapter.autofocusId)
  ) {
    return chapter.autofocusId;
  }
  const ids = new Set(chapter.quests.map((quest) => quest.id));
  const roots = visible.filter(
    (quest) => !quest.dependencies.some((dep) => ids.has(dep)),
  );
  if (!roots.length) return undefined;
  const dependents = new Map<string, string[]>();
  for (const quest of chapter.quests) {
    for (const dep of quest.dependencies) {
      if (!ids.has(dep)) continue;
      const list = dependents.get(dep) ?? [];
      list.push(quest.id);
      dependents.set(dep, list);
    }
  }
  const reachable = (id: string): number => {
    const seen = new Set<string>();
    const stack = [id];
    while (stack.length) {
      const current = stack.pop()!;
      for (const next of dependents.get(current) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        stack.push(next);
      }
    }
    return seen.size;
  };
  let best = roots[0];
  let bestCount = -1;
  for (const root of roots) {
    const count = reachable(root.id);
    if (count > bestCount) {
      best = root;
      bestCount = count;
    }
  }
  return best.id;
}

