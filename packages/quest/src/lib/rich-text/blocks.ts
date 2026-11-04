import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import type { QuestDescriptionBlock } from '@terrafirmagreg-team/quest/types';
import { parseRichText } from './inline';
import { tryParseJsonLine } from './json';
import { splitProperties } from './props';

function parseImageBlock(inner: string): QuestDescriptionBlock | undefined {
  const props = splitProperties(inner);
  if (!props.image) return undefined;
  const width = Number.parseInt(props.width ?? '100', 10);
  const height = Number.parseInt(props.height ?? '100', 10);
  return {
    type: 'image',
    imageRef: props.image,
    width: Number.isFinite(width) ? width : 100,
    height: Number.isFinite(height) ? height : 100,
    align: props.align,
  };
}

const IMAGE_TOKEN = /\{image:[^}]+\}/g;

function pushLineBlocks(
  line: string,
  map: Record<string, string>,
  blocks: QuestDescriptionBlock[],
): void {
  IMAGE_TOKEN.lastIndex = 0;
  let last = 0;
  let found = false;
  for (const match of line.matchAll(IMAGE_TOKEN)) {
    found = true;
    const index = match.index ?? 0;
    const text = line.slice(last, index);
    if (text.trim()) {
      const nodes = parseRichText(text, map);
      if (nodes.length) blocks.push({ type: 'paragraph', nodes });
    }
    const image = parseImageBlock(match[0]!.slice(1, -1));
    if (image) blocks.push(image);
    last = index + match[0]!.length;
  }
  const rest = found ? line.slice(last) : line;
  if (!found || rest.trim()) {
    const nodes = parseRichText(rest, map);
    if (nodes.length) blocks.push({ type: 'paragraph', nodes });
  }
}

export function parseQuestDescription(
  raw: string[] | undefined,
  map: Record<string, string>,
): QuestDescriptionBlock[] {
  if (!raw?.length) return [];
  const blocks: QuestDescriptionBlock[] = [];
  for (const line of raw) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === '{@pagebreak}') {
      blocks.push({ type: 'break' });
      continue;
    }
    const json = tryParseJsonLine(trimmed, map);
    if (json?.length) {
      blocks.push({ type: 'paragraph', nodes: json });
      continue;
    }
    if (
      trimmed.startsWith('{') &&
      trimmed.endsWith('}') &&
      !trimmed.slice(1, -1).includes('{')
    ) {
      const key = trimmed.slice(1, -1);
      if (!key.startsWith('image:')) {
        const resolved = langString(map, `{${key}}`) ?? langString(map, key);
        if (resolved && resolved !== key) {
          blocks.push(...parseQuestDescription(resolved.split('\n'), map));
          continue;
        }
      }
    }
    pushLineBlocks(line, map, blocks);
  }
  return blocks;
}

