import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

export function createQuestCanonicalization() {
  let categoryScope: string | undefined;
  let chapterScope: string | undefined;

  function scope(selection: DatasetRef, category?: string) {
    return JSON.stringify([selection.id, selection.version ?? null, category ?? null]);
  }

  return {
    claimCategory(selection: DatasetRef, category?: string): boolean {
      const next = scope(selection, category);
      if (categoryScope === next) return false;
      categoryScope = next;
      return true;
    },
    claimChapter(selection: DatasetRef, category?: string): boolean {
      const next = scope(selection, category);
      if (chapterScope === next) return false;
      chapterScope = next;
      return true;
    },
  };
}
