import { renderMermaidSVG } from 'beautiful-mermaid';

export function renderMermaidChart(chart: string): string | null {
  try {
    return renderMermaidSVG(chart, {
      bg: 'var(--color-background)',
      fg: 'var(--color-foreground)',
      interactive: true,
      transparent: true,
    });
  } catch {
    return null;
  }
}

