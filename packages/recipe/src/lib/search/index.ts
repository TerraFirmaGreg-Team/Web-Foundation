import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';

function matchesResolvedLabel(
  id: string,
  label: string,
  needle: string,
): boolean {
  const q = needle.trim().toLowerCase();
  if (!q) return true;
  if (label.toLowerCase().includes(q)) return true;
  const lower = id.toLowerCase();
  return lower === q || lower.endsWith(`:${q}`) || lower.endsWith(`/${q}`);
}

type ItemSearchContext = {
  names: Record<string, Record<string, string>>;
  lang: string;
  tagMembers?: Record<string, string[]>;
  mods?: Record<string, string>;
  tooltips?: Record<string, string[]>;
};

type SearchToken = {
  negated: boolean;
  kind: 'name' | 'mod' | 'tag' | 'tooltip';
  needle: string;
  regex?: RegExp;
  memberSet?: Set<string>;
};

const TOKEN_RE = /-?[@#$]?(?:"[^"]*"|\/(?:\\.|[^\\/])*\/|[^\s]+)/g;

function tokenize(query: string): SearchToken[][] {
  return query
    .split('|')
    .map((branch) =>
      (branch.match(TOKEN_RE) ?? [])
        .flatMap((raw): SearchToken[] => {
          if (!raw) return [];
          const negated = raw.startsWith('-');
          let token = negated ? raw.slice(1) : raw;
          let kind: SearchToken['kind'] = 'name';
          const prefix = token.charAt(0);
          if (prefix === '@' || prefix === '#' || prefix === '$') {
            kind = prefix === '@' ? 'mod' : prefix === '#' ? 'tag' : 'tooltip';
            token = token.slice(1);
          }
          if (
            token.length > 1 &&
            token.startsWith('"') &&
            token.endsWith('"')
          ) {
            token = token.slice(1, -1);
          } else if (
            token.length > 1 &&
            token.startsWith('/') &&
            token.endsWith('/')
          ) {
            try {
              return [
                {
                  negated,
                  kind,
                  needle: '',
                  regex: new RegExp(token.slice(1, -1), 'i'),
                },
              ];
            } catch {}
          }
          const needle = token.trim().toLowerCase();
          return needle ? [{ negated, kind, needle }] : [];
        }),
    )
    .filter((branch) => branch.length > 0);
}

function tagMemberSet(token: SearchToken, ctx: ItemSearchContext): Set<string> {
  const set = new Set<string>();
  const test = (value: string) =>
    token.regex
      ? token.regex.test(value)
      : value.toLowerCase().includes(token.needle);
  for (const [tag, ids] of Object.entries(ctx.tagMembers ?? {})) {
    if (test(tag) || test(recipeItemName(ctx.names, ctx.lang, tag))) {
      for (const id of ids) set.add(id);
    }
  }
  return set;
}

function matchToken(
  token: SearchToken,
  id: string,
  label: string,
  ctx: ItemSearchContext,
): boolean {
  const test = (value: string) =>
    token.regex
      ? token.regex.test(value)
      : value.toLowerCase().includes(token.needle);
  switch (token.kind) {
    case 'mod': {
      const ns = id.split(':')[0] ?? '';
      const modName = (ctx.mods?.[ns] ?? '').toLowerCase().replace(/\s+/g, '');
      return test(modName) || test(ns);
    }
    case 'tag': {
      token.memberSet ??= tagMemberSet(token, ctx);
      return token.memberSet.has(id);
    }
    case 'tooltip':
      return (ctx.tooltips?.[id] ?? []).some((line) => test(line));
    default:
      if (token.regex) return token.regex.test(label) || token.regex.test(id);
      return matchesResolvedLabel(id, label, token.needle);
  }
}

function matchesGameItemSearch(
  id: string,
  ctx: ItemSearchContext,
  groups: SearchToken[][],
): boolean {
  const label = recipeItemName(ctx.names, ctx.lang, id);
  return groups.some((branch) =>
    branch.every((token) => matchToken(token, id, label, ctx) !== token.negated),
  );
}

export function filterCatalogItemIds(
  ids: string[],
  query: string,
  ctx: ItemSearchContext,
): string[] {
  const groups = tokenize(query);
  if (!groups.length) return ids;
  return ids.filter((id) => matchesGameItemSearch(id, ctx, groups));
}

