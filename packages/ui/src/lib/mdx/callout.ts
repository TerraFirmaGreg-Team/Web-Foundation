import type { CSSProperties } from 'react';

export const COLORS: Record<string, string> = {
  info: 'var(--color-info)',
  note: 'var(--color-note)',
  tip: 'var(--color-tip)',
  warn: 'var(--color-warning)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  danger: 'var(--color-error)',
  success: 'var(--color-success)',
  idea: 'var(--color-idea)',
};

export function calloutStyle(
  type: string,
  style: CSSProperties | undefined,
): CSSProperties {
  return { '--callout-color': COLORS[type] ?? COLORS.info, ...style } as CSSProperties;
}

