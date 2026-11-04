export function isItemChipId(id: string, tagSet: Set<string>): boolean {
  return !tagSet.has(id) && !tagSet.has(id.startsWith('#') ? id : `#${id}`);
}

