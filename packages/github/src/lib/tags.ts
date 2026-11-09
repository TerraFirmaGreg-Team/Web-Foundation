import type { HistoryCommit } from 'fumadocs-page-history';

type HistoryTag = NonNullable<HistoryCommit['tags']>[number];

const PKG_TAG = /^[\w-]+@(.+)$/;

export function compactTags(
  tags: HistoryTag[] | undefined,
  repoUrl: string,
): HistoryTag[] | undefined {
  if (!tags?.length) return tags;
  const groups = new Map<string, HistoryTag[]>();
  for (const tag of tags) {
    const version = PKG_TAG.exec(tag.name)?.[1];
    if (version) {
      const group = groups.get(version) ?? [];
      group.push(tag);
      groups.set(version, group);
    }
  }
  const bursts = new Map<string, number>();
  const collapsed = new Set<HistoryTag>();
  for (const [version, group] of groups) {
    if (group.length < 2) continue;
    bursts.set(version, group.length);
    for (const tag of group) collapsed.add(tag);
  }
  if (!bursts.size) return tags;
  const bare = new Set(
    tags.filter((t) => !t.name.includes('@')).map((t) => t.name),
  );
  const chip = (version: string): HistoryTag => ({
    name: `+${bursts.get(version)}`,
    url: `${repoUrl}/releases?q=${encodeURIComponent(version)}`,
  });
  const emitted = new Set<string>();
  const out: HistoryTag[] = [];
  for (const tag of tags) {
    const version = collapsed.has(tag) ? PKG_TAG.exec(tag.name)![1] : undefined;
    if (version) {
      if (!bare.has(version) && !emitted.has(version)) {
        out.push(chip(version));
        emitted.add(version);
      }
      continue;
    }
    out.push(tag);
    if (bursts.has(tag.name) && !emitted.has(tag.name)) {
      out.push(chip(tag.name));
      emitted.add(tag.name);
    }
  }
  return out;
}
