import type { McTextStyle } from '@terrafirmagreg-team/quest/types';
import { parseRichText } from './inline';

export function plainQuestText(
  raw: string | undefined,
  map: Record<string, string>,
): string {
  if (!raw) return '';
  const nodes = parseRichText(raw, map);
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'text':
          return node.text;
        case 'link':
        case 'quest':
          return node.children
            .map((child) => (child.type === 'text' ? child.text : ''))
            .join('');
        default: {
          const _never: never = node;
          return _never;
        }
      }
    })
    .join('');
}

export function styleClassName(style: McTextStyle): string {
  const classes: string[] = [];
  if (style.bold) classes.push('font-bold');
  if (style.italic) classes.push('italic');
  if (style.underline) classes.push('underline');
  if (style.strike) classes.push('line-through');
  return classes.join(' ');
}
