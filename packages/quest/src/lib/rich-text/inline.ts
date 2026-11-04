import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { MC_FORMAT_COLORS } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type { McTextStyle, RichTextNode } from '@terrafirmagreg-team/quest/types';
import { splitProperties } from './props';

function applyCode(style: McTextStyle, code: string): McTextStyle {
  if (code === 'r') return {};
  if (code === 'l') return { ...style, bold: true };
  if (code === 'o') return { ...style, italic: true };
  if (code === 'n') return { ...style, underline: true };
  if (code === 'm') return { ...style, strike: true };
  if (code in MC_FORMAT_COLORS) {
    return { ...style, color: MC_FORMAT_COLORS[code] };
  }
  return style;
}

function substitute(
  key: string,
  map: Record<string, string>,
  style: McTextStyle,
): RichTextNode[] {
  if (key.startsWith('@')) return [{ type: 'text', text: `{${key}}`, style }];
  const props = key.includes(':') ? splitProperties(key) : undefined;
  if (props?.open_url) {
    const href = props.open_url;
    if (href.startsWith('http://') || href.startsWith('https://')) {
      const label = props.text || href;
      return [
        {
          type: 'link',
          href,
          children: parseRichText(label, map, style),
        },
      ];
    }
  }
  const resolved = langString(map, `{${key}}`) ?? langString(map, key);
  if (resolved && resolved !== key) return parseRichText(resolved, map, style);
  return [{ type: 'text', text: `{${key}}`, style }];
}

export function parseRichText(
  text: string,
  map: Record<string, string>,
  inherited: McTextStyle = {},
): RichTextNode[] {
  const src = text
    .replaceAll('\\n', '\n')
    .replace(/\$\(br\)/gi, '\n')
    .replace(/\$\(reset\)|\$\(r\)/gi, '&r')
    .replace(/\$\(bold\)|\$\(l\)/gi, '&l')
    .replace(/\$\(italic[s]?\)|\$\(o\)/gi, '&o')
    .replace(/\$\(#([0-9a-fA-F]{6})\)/g, '&#$1')
    .replace(/\$\(([0-9a-fk-or])\)/gi, '&$1');
  const nodes: RichTextNode[] = [];
  let style: McTextStyle = { ...inherited };
  let buffer = '';
  const flush = () => {
    if (!buffer) return;
    nodes.push({ type: 'text', text: buffer, style: { ...style } });
    buffer = '';
  };

  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if ((c === '&' || c === '§') && i + 1 < src.length) {
      const code = src[i + 1]!.toLowerCase();
      if (code === '#') {
        const hex = src.slice(i + 2, i + 8);
        if (/^[0-9a-fA-F]{6}$/.test(hex)) {
          flush();
          style = { ...style, color: `#${hex}` };
          i += 7;
          continue;
        }
      }
      flush();
      style = applyCode(style, code);
      i += 1;
      continue;
    }
    if (c === '{') {
      const end = src.indexOf('}', i + 1);
      if (end > i) {
        const inner = src.slice(i + 1, end);
        if (inner.startsWith('image:')) {
          i = end;
          continue;
        }
        flush();
        nodes.push(...substitute(inner, map, style));
        i = end;
        continue;
      }
    }
    buffer += c;
  }
  flush();
  return nodes;
}

