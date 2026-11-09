const LANG_REGION: Record<string, string> = {
  af: 'za',
  ar: 'sa',
  ca: 'es',
  cs: 'cz',
  da: 'dk',
  el: 'gr',
  et: 'ee',
  eu: 'es',
  fa: 'ir',
  he: 'il',
  hi: 'in',
  hy: 'am',
  ja: 'jp',
  ka: 'ge',
  ko: 'kr',
  ms: 'my',
  sl: 'si',
  sq: 'al',
  sr: 'rs',
  sv: 'se',
  uk: 'ua',
  vi: 'vn',
  zh: 'cn',
};

export function crowdinFlagLocale(id: string): string {
  const [primary, region] = id.split('-');
  const flag = region ?? LANG_REGION[primary!] ?? primary;
  return `${primary}_${flag}`;
}
