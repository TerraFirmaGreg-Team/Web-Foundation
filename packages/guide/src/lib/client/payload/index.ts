import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { loadClientGuideBook } from '@terrafirmagreg-team/guide/lib/client/books';
import { uiConfig } from '@terrafirmagreg-team/ui/lib/config';
import { categoryMap } from '@terrafirmagreg-team/guide/lib/nav/breadcrumb';
import { bareId, guideBookHref } from '@terrafirmagreg-team/guide/lib/nav/paths';
import { sectionEmbeds } from '@terrafirmagreg-team/kit/lib/embeds';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type {
  GuideMessages,
  GuidePagePayload,
} from '@terrafirmagreg-team/guide/types';
import { entryExtras } from './extras';
import { type QuestLinks, collectTextLinks } from './links';

export async function loadClientGuidePayload(
  dataset: DatasetRef,
  lang: Lang,
  bookId: string | undefined,
  entryId: string | undefined,
  categoryId: string | undefined,
  langMap: Record<string, string>,
  messages: GuideMessages,
): Promise<GuidePagePayload | undefined> {
  if (!bookId) return undefined;
  const overview = await loadClientGuideBook(dataset, lang, bookId);
  if (!overview || overview.status !== 'ready') return undefined;

  const entry = entryId
    ? overview.entries.find(
        (item) => item.id === entryId || bareId(item.id) === bareId(entryId),
      )
    : undefined;
  const category =
    !entry && categoryId
      ? overview.categories.find((item) => item.id === categoryId)
      : undefined;
  const kind = entry ? 'entry' : category ? 'category' : 'overview';
  const categoryByEntry = categoryMap(overview.categories);
  const bookModId = overview.modId;
  const bookPath = overview.bookPath ?? '';

  const questLinks: QuestLinks = {};
  const hrefs = new Set<string>();
  const linkCtx = { lang, modId: bookModId, bookPath, categoryByEntry };
  await collectTextLinks(
    dataset,
    questLinks,
    hrefs,
    linkCtx,
    category?.description ?? overview.book?.landingText,
  );
  hrefs.add(guideBookHref(dataset, undefined, bookModId, bookPath));
  const entryCat = entry
    ? overview.categories.find((cat) =>
        cat.entries.some((row) => row.id === entry.id),
      )
    : undefined;
  const firstEntry = entryCat?.entries[0]?.id;
  if (firstEntry) {
    hrefs.add(
      guideBookHref(dataset, undefined, bookModId, bookPath, firstEntry),
    );
  }

  const extras = entry
    ? await entryExtras(
        dataset,
        lang,
        langMap,
        bookModId,
        bookPath,
        categoryByEntry,
        questLinks,
        hrefs,
        entry,
      )
    : undefined;
  for (const hit of Object.values(questLinks)) {
    const url = sectionEmbeds().quest?.href(dataset, undefined, {
      category: hit.filename,
      id: hit.questId,
    });
    if (url) hrefs.add(url);
  }

  const previews = await uiConfig().loadPagePreviews?.(lang, langMap, hrefs) ?? {};
  const payloadCategoryId = entry ? entryCat?.id : category?.id;

  return {
    kind,
    dataset,
    lang,
    title: entry?.name ?? category?.name ?? overview.book?.name ?? bookId,
    modId: bookModId,
    bookPath,
    description: entry ? undefined : category?.description,
    previewIcon:
      entry?.icon?.id ?? category?.icon?.id ?? overview.book?.cover?.id,
    previewKind: entry?.icon?.kind ?? category?.icon?.kind,
    categoryId: payloadCategoryId,
    bookModId,
    book: overview.book,
    categories: overview.categories,
    entries: overview.entries.map(({ pages: _pages, ...stub }) => stub),
    ...(entry ? { entry, extras } : {}),
    ...(Object.keys(questLinks).length ? { questLinks } : {}),
    ...(Object.keys(previews).length ? { previews } : {}),
    messages,
  };
}

