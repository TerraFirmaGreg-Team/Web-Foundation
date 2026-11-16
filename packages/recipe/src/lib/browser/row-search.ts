import type { RecipeCompactRow } from '@terrafirmagreg-team/recipe/types';

export function rowSearchTerms(query: string): string[] {
  return query
    .split('|')
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
}

export function rowMatchesTerms(
  row: RecipeCompactRow,
  terms: string[],
  nameOf: (id: string) => string | undefined,
): boolean {
  if (!terms.length) return true;
  const ids = [...row.in, ...row.out];
  return terms.some((term) =>
    ids.some(
      (id) =>
        id.toLowerCase().includes(term) ||
        (nameOf(id)?.toLowerCase().includes(term) ?? false),
    ),
  );
}
