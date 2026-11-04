import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
export function viewportStorageKey(dataset: DatasetRef, filename: string): string {
  return `wiki.quest.viewport.${dataset.id}/${dataset.version ?? ''}.${filename}`;
}

