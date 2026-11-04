import type { GuideTableCell } from '@terrafirmagreg-team/guide/types';

export function cssColor(value: string | undefined): string | undefined {
  return value && /^0x[0-9a-f]{6}$/i.test(value) ? `#${value.slice(2)}` : value;
}

export function cellTexts(cell: GuideTableCell): string[] {
  if (Array.isArray(cell.texts)) return cell.texts.filter(Boolean);
  return typeof cell.text === 'string' && cell.text ? [cell.text] : [];
}

