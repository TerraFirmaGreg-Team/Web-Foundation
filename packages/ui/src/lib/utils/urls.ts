export function safeURL(value?: string): string | undefined {

  if (!value || /[\u0000-\u0020\\]/.test(value)) return undefined;
  return /^(https?:\/\/|\/(?!\/)|#)/i.test(value) ? value : undefined;
}

export function normalize(urlOrPath: string) {
  if (urlOrPath.length > 1 && urlOrPath.endsWith('/')) return urlOrPath.slice(0, -1);
  return urlOrPath;
}

export function isActive(href: string, pathname: string, nested = false): boolean {
  href = normalize(href);
  pathname = normalize(pathname);

  return href === pathname || (nested && pathname.startsWith(`${href}/`));
}

