import type { GuidePage } from '@terrafirmagreg-team/guide/types';
import type { GuideTableCell } from '@terrafirmagreg-team/guide/lib/data/dto';
import type { GuideMarkdownCtx } from './ctx';
import { guideTextMarkdown } from './text';

function cellText(cell: string | GuideTableCell | undefined): string {
  if (typeof cell === 'string') return cell;
  if (!cell || typeof cell !== 'object') return '';
  const lines = Array.isArray(cell.texts)
    ? cell.texts
    : cell.text
      ? [cell.text]
      : [];
  return lines.filter(Boolean).join(' ');
}

export function tableMarkdown(page: GuidePage, ctx: GuideMarkdownCtx): string {
  const strings = page.strings ?? [];
  const rows = strings
    .map((row) => (Array.isArray(row) ? row : [row]))
    .filter((row) => row.length);
  const columns = Array.isArray(page.columns)
    ? page.columns.map((c) => String(c))
    : [];
  const all = columns.length ? [columns, ...rows.map((r) => r.map(cellText))] : rows.map((r) => r.map(cellText));
  if (!all.length) return '';
  const width = Math.max(...all.map((row) => row.length));
  const norm = (row: unknown[]) =>
    Array.from({ length: width }, (_v, i) =>
      guideTextMarkdown(String(row[i] ?? ''), ctx).replace(/\|/g, '\\|').replace(/\n+/g, ' '),
    );
  const lines = all.map((row) => `| ${norm(row).join(' | ')} |`);
  lines.splice(1, 0, `| ${Array.from({ length: width }, () => '---').join(' | ')} |`);
  return lines.join('\n');
}

