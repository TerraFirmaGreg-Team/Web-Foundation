export function guideDumpHasContent(dump: {
  mods: readonly { books: readonly unknown[] }[];
}): boolean {
  return dump.mods.some((mod) => mod.books.length > 0);
}

