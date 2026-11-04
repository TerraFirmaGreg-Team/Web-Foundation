export function md(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  const raw = String.raw(strings, ...values);
  const lines = raw
    .replace(/^\n/, '')
    .replace(/\s+$/, '')
    .split('\n');
  const indent = Math.min(
    ...lines
      .filter((l) => l.trim())
      .map((l) => (l.match(/^ */)?.[0].length ?? 0)),
  );
  return lines
    .map((l) => l.slice(indent))
    .join('\n')
    .replaceAll('\\`', '`');
}

