import type { CSSProperties } from 'react';

export const COLORS: Record<string, string> = {
  note: 'var(--color-note)',
  tip: 'var(--color-tip)',
  info: 'var(--color-info)',
  important: 'var(--color-important)',
  warn: 'var(--color-warning)',
  warning: 'var(--color-warning)',
  caution: 'var(--color-caution)',
  attention: 'var(--color-attention)',
  danger: 'var(--color-danger)',
  error: 'var(--color-error)',
  success: 'var(--color-success)',
  idea: 'var(--color-idea)',
  question: 'var(--color-question)',
  failure: 'var(--color-failure)',
  bug: 'var(--color-bug)',
  abstract: 'var(--color-abstract)',
  example: 'var(--color-example)',
  quote: 'var(--color-quote)',
};

export function calloutStyle(
  type: string,
  style: CSSProperties | undefined,
): CSSProperties {
  return { '--callout-color': COLORS[type] ?? COLORS.info, ...style } as CSSProperties;
}

