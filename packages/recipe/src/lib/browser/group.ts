import type {
  CategoryGroup,
  RecipeCategory,
  RecipeCompactRow,
} from '@terrafirmagreg-team/recipe/types';

export function groupByCategory(
  rows: RecipeCompactRow[],
  types: string[],
  categories?: RecipeCategory[],
): CategoryGroup[] {
  const groups = [...Map.groupBy(rows, (row) => types[row.type] ?? '')].map(
    ([category, rows]) => ({ category, rows }),
  );
  if (!categories?.length) return groups;
  const order = new Map(categories.map((row, index) => [row.id, index]));
  return groups.sort(
    (a, b) =>
      (order.get(a.category) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(b.category) ?? Number.MAX_SAFE_INTEGER),
  );
}

