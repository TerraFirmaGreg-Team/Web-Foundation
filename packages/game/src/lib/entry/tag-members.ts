function memberFamily(id: string): string {
  const sep = id.indexOf(':');
  if (sep < 0) return id;
  const path = id.slice(sep + 1);
  const slash = path.lastIndexOf('/');
  return `${id.slice(0, sep)}:${slash < 0 ? path : path.slice(0, slash)}`;
}

export function diverseTagMembers(members: string[], limit: number): string[] {
  const families = new Map<string, string[]>();
  for (const member of members) {
    const key = memberFamily(member);
    const group = families.get(key);
    if (group) {
      group.push(member);
    } else {
      families.set(key, [member]);
    }
  }
  const out: string[] = [];
  let added = true;
  while (out.length < limit && added) {
    added = false;
    for (const group of families.values()) {
      const member = group.shift();
      if (member === undefined) continue;
      out.push(member);
      added = true;
      if (out.length >= limit) break;
    }
  }
  return out;
}
