import type * as PageTree from '@terrafirmagreg-team/translate/types/tree';

export type NavItemMatch = (url: string) => boolean;

function sameValue(want: string, have: string | null): boolean {
  return have === want;
}

export function isNavItemActive(
  href: string,
  pathname: string,
  search: string,
  navKeys?: ReadonlySet<string>,
  nested = false,
) {
  const q = href.indexOf('?');
  const query = q >= 0 ? href.slice(q + 1) : undefined;
  let path = q >= 0 ? href.slice(0, q) : href;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  if (pathname.length > 1 && pathname.endsWith('/'))
    pathname = pathname.slice(0, -1);
  if (path !== pathname && !(nested && pathname.startsWith(`${path}/`)))
    return false;
  const want = new URLSearchParams(query ?? '');
  const have = new URLSearchParams(search);
  const keys = new Set<string>();
  for (const key of want.keys()) keys.add(key);
  for (const key of have.keys()) if (navKeys?.has(key)) keys.add(key);
  for (const key of keys) {
    const wantValue = want.get(key);
    if (wantValue === null) return false;
    if (!sameValue(wantValue, have.get(key))) return false;
  }
  return true;
}

export function hasActiveDescendant(
  node: PageTree.Node,
  match: NavItemMatch,
): boolean {
  if (node.type === 'page') return match(node.url);
  if (node.type === 'folder') {
    return (
      (node.index !== undefined && match(node.index.url)) ||
      node.children.some((child) => hasActiveDescendant(child, match))
    );
  }
  return false;
}

export function langScopeKey(
  id: string | undefined,
  languages: readonly string[],
) {
  for (const lang of languages)
    id = id?.replaceAll(`:${lang}`, '').replaceAll(`/${lang}`, '');
  return id;
}

