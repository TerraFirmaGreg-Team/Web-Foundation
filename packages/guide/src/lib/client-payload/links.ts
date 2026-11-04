import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import {
  guideEmbeds,
  type EmbedQuestLocation,
} from '@terrafirmagreg-team/guide/lib/embeds';
import { classify, pageTexts } from '@terrafirmagreg-team/guide/lib/page-kind';
import { formatGuide } from '@terrafirmagreg-team/guide/lib/format';
import {
  parseGuideReference,
  resolveGuideReference,
} from '@terrafirmagreg-team/guide/lib/reference/resolver';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { GuidePage } from '@terrafirmagreg-team/guide/types';

export type QuestLinks = Record<string, EmbedQuestLocation>;

async function collectQuestLink(
  dataset: DatasetRef,
  questLinks: QuestLinks,
  target: string | undefined,
  force = false,
): Promise<void> {
  if (!target || /^https?:\/\//i.test(target)) return;
  const ref = parseGuideReference(target);
  if (!force && ref.kind !== 'quest') return;
  if (questLinks[ref.id]) return;
  const hit = await guideEmbeds().quest?.findLocation(dataset, ref.id);
  if (hit) questLinks[ref.id] = hit;
}

export async function collectTextLinks(
  dataset: DatasetRef,
  questLinks: QuestLinks,
  hrefs: Set<string>,
  ctx: {
    lang: Lang;
    modId?: string;
    bookPath?: string;
    categoryByEntry: Map<string, string>;
  },
  text: string | undefined,
): Promise<void> {
  if (!text) return;
  for (const node of formatGuide(text, {})) {
    const link = 'link' in node ? node.link : undefined;
    if (!link) continue;
    await collectQuestLink(dataset, questLinks, link);
    if (/^https?:\/\//i.test(link)) continue;
    const resolved = resolveGuideReference(parseGuideReference(link), {
      dataset,
      lang: ctx.lang,
      modId: ctx.modId ?? '',
      bookPath: ctx.bookPath ?? '',
      categoryByEntry: ctx.categoryByEntry,
      questLinks,
    });
    if (resolved.href) hrefs.add(resolved.href);
  }
}

export async function collectPageLinks(
  dataset: DatasetRef,
  lang: Lang,
  bookModId: string,
  bookPath: string,
  categoryByEntry: Map<string, string>,
  questLinks: QuestLinks,
  hrefs: Set<string>,
  page: GuidePage,
): Promise<void> {
  const ctx = { lang, modId: bookModId, bookPath, categoryByEntry };
  if (classify(page.type) === 'quest') {
    await collectQuestLink(
      dataset,
      questLinks,
      page.trigger || page.quest || page.link,
      true,
    );
  }
  await collectTextLinks(dataset, questLinks, hrefs, ctx, page.title);
  for (const text of pageTexts(page)) {
    await collectTextLinks(dataset, questLinks, hrefs, ctx, text);
  }
  for (const target of [
    page.url,
    page.link,
    page.entry,
    ...(page.entries ?? []),
  ]) {
    if (!target || /^https?:\/\//i.test(target)) continue;
    await collectQuestLink(dataset, questLinks, target);
    const resolved = resolveGuideReference(parseGuideReference(target), {
      dataset,
      lang,
      modId: bookModId,
      bookPath,
      categoryByEntry,
      questLinks,
    });
    if (resolved.href) hrefs.add(resolved.href);
  }
}

