import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { registerMarkdownProvider } from '@terrafirmagreg-team/mdx/lib/markdown';
import { loadClientGuidePayload } from '@terrafirmagreg-team/guide/lib/client/payload';
import { clientDumpLang } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { categoryMap } from '@terrafirmagreg-team/guide/lib/nav/breadcrumb';
import {
  guideCategoryMarkdown,
  guideEntryMarkdown,
  guideOverviewMarkdown,
  type GuideMarkdownCtx,
} from '@terrafirmagreg-team/guide/lib/markdown';
import type { GuideIndex } from '@terrafirmagreg-team/guide/types';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export async function guideMarkdown(
  req: Request,
  dataset: DatasetRef | undefined,
  lang: Lang,
): Promise<Response | undefined> {
  if (!dataset) return undefined;
  const search = new URL(req.url).searchParams;
  const langMap = await clientDumpLang(dataset, lang);
  const payload = await loadClientGuidePayload(
    dataset,
    lang,
    search.get('book') ?? undefined,
    search.get('entry') ?? undefined,
    search.get('cat') ?? undefined,
    langMap,
    {},
  );
  if (!payload) return undefined;
  const overview: GuideIndex = {
    status: 'ready',
    root: '',
    modId: payload.bookModId ?? payload.modId ?? '',
    bookPath: payload.bookPath,
    book: payload.book ?? null,
    categories: payload.categories ?? [],
    entries: payload.entries ?? [],
    language: lang,
    isFallback: false,
  };
  const ctx: GuideMarkdownCtx = {
    dataset,
    lang,
    langMap,
    keybinds: payload.extras?.keybinds,
    macros: payload.book?.macros,
    questLinks: payload.questLinks,
    categoryByEntry: categoryMap(payload.categories ?? []),
    entryNames: new Map(
      (payload.entries ?? []).flatMap((row) =>
        row.name ? [[row.id, row.name]] : [],
      ),
    ),
    modId: overview.modId,
    bookPath: payload.bookPath ?? '',
  };
  const markdown =
    payload.kind === 'entry' && payload.entry
      ? guideEntryMarkdown(payload.entry, ctx, payload)
      : payload.kind === 'category' && payload.categoryId
        ? guideCategoryMarkdown(overview, payload.categoryId, ctx)
        : guideOverviewMarkdown(overview, ctx);
  return new Response(markdown, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}

registerMarkdownProvider('guide', (req, { slugs, lang }) =>
  guideMarkdown(req, slugs[0] ? { id: slugs[0] } : undefined, lang),
);

