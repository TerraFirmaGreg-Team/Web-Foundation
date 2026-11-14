export const LANG_COOKIE = 'wiki_lang';
export const LANG_HEADER = 'x-wiki-lang';

const COOKIE_PATTERN = new RegExp(`(?:^|;\\s*)${LANG_COOKIE}=([^;]+)`);

export function readLangCookie(): string | undefined {
  return COOKIE_PATTERN.exec(document.cookie)?.[1];
}

export function writeLangCookie(lang: string): void {
  document.cookie = `${LANG_COOKIE}=${lang};path=/;max-age=31536000;samesite=lax`;
}

export function requestLang(
  cookie: string | null | undefined,
  header: string | null | undefined,
): string | undefined {
  return cookie ?? header ?? undefined;
}
