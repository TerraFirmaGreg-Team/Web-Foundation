import type { GuideFormatNode } from '@terrafirmagreg-team/guide/types';
import { formatGuide, keybindLabels } from '@terrafirmagreg-team/guide/lib/format';
import { guideLink } from '@terrafirmagreg-team/guide/lib/reference';
import { type GuideMarkdownCtx, refCtx } from './ctx';

function wrap(text: string, mark: string): string {
  return text.replace(/^(\s*)(.*?)(\s*)$/s, (_m, a, b, c) =>
    b ? `${a}${mark}${b}${mark}${c}` : `${a}${c}`,
  );
}

function nodeMarkdown(node: GuideFormatNode, ctx: GuideMarkdownCtx): string {
  if (node.type === 'break') return '\n';
  if (node.type === 'keybind') {
    return `\`${keybindLabels(node.value, ctx.langMap, ctx.keybinds ?? {}).label}\``;
  }
  if (node.type === 'command') return `\`${node.value}\``;
  let text = node.value;
  if (node.styles.includes('bold')) text = wrap(text, '**');
  if (node.styles.includes('italic')) text = wrap(text, '_');
  if (node.styles.includes('strike')) text = wrap(text, '~~');
  if (node.link) {
    const { href } = guideLink(node, refCtx(ctx));
    if (href) text = `[${text.trim() || node.link}](${href})`;
  }
  return text;
}

export function guideTextMarkdown(
  raw: string,
  ctx: GuideMarkdownCtx,
): string {
  return formatGuide(raw, { macros: ctx.macros })
    .map((node) => nodeMarkdown(node, ctx))
    .join('')
    .replace(/(^|\n)(\s*)• /g, '$1$2- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

