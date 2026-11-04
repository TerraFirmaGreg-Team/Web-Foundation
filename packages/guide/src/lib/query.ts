import type { GuideIndex } from '@terrafirmagreg-team/guide/types';

type GuideQuery = {
  bookId?: string;
  entryId?: string;
  categoryId?: string;
};

export function guideQueryFromParams(params: {
  get(name: string): string | null;
}): GuideQuery {
  const book = params.get('book') ?? undefined;
  const entry = params.get('entry') ?? undefined;
  const category = params.get('cat') ?? undefined;
  return {
    ...(book ? { bookId: book } : {}),
    ...(entry ? { entryId: entry } : {}),
    ...(category ? { categoryId: category } : {}),
  };
}

export function firstGuideEntryId(index: GuideIndex): string | undefined {
  return (
    index.categories.flatMap((category) =>
      category.entries.map((entry) => entry.id),
    )[0] ?? index.entries[0]?.id
  );
}

