export function flattenMessages(
  value: unknown,
  file: string,
  prefix = '',
): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Locale ${file}: ${prefix || '<root>'} must be an object`);
  }
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof entry === 'string') out[path] = entry;
    else Object.assign(out, flattenMessages(entry, file, path));
  }
  return out;
}

