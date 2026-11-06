import { collectItemIds } from '@terrafirmagreg-team/guide/lib/data/parse';
import type { GuideEntry } from '@terrafirmagreg-team/guide/types';

export function spriteIdsFromEntry(entry: GuideEntry): string[] {
  const ids: string[] = [];
  if (entry.icon && entry.icon.kind !== 'texture') ids.push(entry.icon.id);
  for (const page of entry.pages ?? []) {
    ids.push(...collectItemIds(page.item), ...collectItemIds(page.icon));
    if (typeof page.entity === 'string') ids.push(page.entity);
    ids.push(
      ...(page.recipes ?? []).filter(
        (id): id is string => typeof id === 'string' && Boolean(id),
      ),
    );
  }
  return ids;
}

