export function questDumpHasContent(dump: {
  mods: readonly { questData: string | null }[];
}): boolean {
  return dump.mods.some((mod) => mod.questData != null);
}

