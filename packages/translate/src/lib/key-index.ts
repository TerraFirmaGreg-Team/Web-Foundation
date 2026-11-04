const NOTE_KEY = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/;

export function buildKeyIndex(
  messages: Partial<Record<string, string>>,
): Map<string, string> {
  const index = new Map<string, string>();
  for (const key of Object.keys(messages)) {
    const end = key.lastIndexOf('(');
    if (!key.endsWith(')') || end < 0) continue;
    const note = key.slice(end + 1, -1);
    if (NOTE_KEY.test(note)) index.set(note, key);
  }
  return index;
}

export function stripKeyNote(full: string, key: string): string {
  return full !== key && full.endsWith(`(${key})`)
    ? full.slice(0, -(key.length + 2))
    : full;
}

