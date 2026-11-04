import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { MC_FORMAT_COLORS } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type { McTextStyle, RichTextNode } from '@terrafirmagreg-team/quest/types';
import { parseRichText } from './inline';

function wrapClick(
  nodes: RichTextNode[],
  clickEvent: unknown,
): RichTextNode[] {
  if (!nodes.length || !clickEvent || typeof clickEvent !== 'object')
    return nodes;
  const event = clickEvent as { action?: unknown; value?: unknown };
  if (typeof event.action !== 'string' || typeof event.value !== 'string')
    return nodes;
  if (event.action === 'change_page') {
    return [
      {
        type: 'quest',
        questId: event.value.replace(/^#/, ''),
        children: nodes,
      },
    ];
  }
  if (
    event.action === 'open_url' &&
    (event.value.startsWith('http://') || event.value.startsWith('https://'))
  ) {
    return [{ type: 'link', href: event.value, children: nodes }];
  }
  return nodes;
}

function parseJsonComponent(
  value: unknown,
  map: Record<string, string>,
  inherited: McTextStyle = {},
): RichTextNode[] | null {
  if (typeof value === 'string') return parseRichText(value, map, inherited);
  if (Array.isArray(value)) {
    return value.flatMap(
      (entry) => parseJsonComponent(entry, map, inherited) ?? [],
    );
  }
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.text !== 'string' &&
    typeof row.translate !== 'string' &&
    !Array.isArray(row.extra)
  ) {
    return null;
  }
  const style: McTextStyle = { ...inherited };
  if (typeof row.color === 'string') {
    const named =
      MC_FORMAT_COLORS[row.color] ??
      (row.color.startsWith('#') ? row.color : undefined);
    if (named) style.color = named;
  }
  if (row.bold === true) style.bold = true;
  if (row.italic === true) style.italic = true;
  if (row.underlined === true) style.underline = true;
  if (row.strikethrough === true) style.strike = true;
  const parts: RichTextNode[] = [];
  if (typeof row.text === 'string') {
    parts.push(...parseRichText(row.text, map, style));
  }
  if (typeof row.translate === 'string') {
    const translated = langString(map, row.translate) ?? row.translate;
    parts.push(...parseRichText(translated, map, style));
  }
  if (Array.isArray(row.extra)) {
    for (const extra of row.extra) {
      parts.push(...(parseJsonComponent(extra, map, style) ?? []));
    }
  }
  return wrapClick(parts, row.clickEvent);
}

export function tryParseJsonLine(
  line: string,
  map: Record<string, string>,
): RichTextNode[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return parseJsonComponent(JSON.parse(trimmed) as unknown, map);
  } catch {
    return null;
  }
}

