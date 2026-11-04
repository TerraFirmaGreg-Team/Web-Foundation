export function recipeDumpHasContent(dump: {
  mods: readonly { recipeIndex: string | null }[];
}): boolean {
  return dump.mods.some((mod) => mod.recipeIndex != null);
}

