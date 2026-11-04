export const env = (key: string): string | undefined =>
  process.env[key]?.trim() || undefined;

