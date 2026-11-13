import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { stripMcFormat } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { ogStackName } from '@terrafirmagreg-team/dump/lib/dump/assets/og';
import {
  ogImageQuery,
  ogName,
  registerOgResolver,
  type OgContext,
} from '@terrafirmagreg-team/preview/lib';
import { loadQuestCompactIndex } from './client/quest';

function refIcon(
  icon: string | undefined,
  iconKind: string | undefined,
): string | undefined {
  return icon && iconKind ? `${iconKind}:${icon}` : undefined;
}

async function questOgContext(
  dataset: DatasetRef,
  search: URLSearchParams,
  lang: Lang,
): Promise<OgContext> {
  const index = await loadQuestCompactIndex(dataset, lang);
  const questId = search.get('id');
  if (questId) {
    const quest = index.quests.find((row) => row.id === questId);
    if (!quest) return {};
    const icon =
      refIcon(quest.icon, quest.iconKind) ??
      (quest.items[0] ? `item:${quest.items[0]}` : undefined);
    const entity = {
      kind: 'quest',
      ...ogName(quest.title ?? quest.id),
      id: quest.id,
      ...(icon ? { icon } : {}),
    };
    const description = quest.subtitle
      ? stripMcFormat(quest.subtitle).trim()
      : undefined;
    return { entity, description, imageQuery: ogImageQuery(entity, description) };
  }
  const item = search.get('item');
  if (item) {
    const count = index.quests.filter((row) =>
      row.items.includes(item),
    ).length;
    const entity = {
      kind: 'item',
      name: await ogStackName(dataset, item, 'item', lang),
      id: item,
      icon: `item:${item}`,
    };
    const description = `${count} quest${count === 1 ? '' : 's'}`;
    return { entity, description, imageQuery: ogImageQuery(entity, description) };
  }
  const category = search.get('category');
  if (!category) return {};
  const chapter = index.chapters.find((row) => row.filename === category);
  if (!chapter) return {};
  const count = index.quests.filter(
    (row) => row.filename === chapter.filename,
  ).length;
  const group = chapter.group
    ? (index.groups.find((row) => row.id === chapter.group)?.title ??
      chapter.group)
    : undefined;
  const chapterIcon = refIcon(chapter.icon, chapter.iconKind);
  const entity = {
    kind: 'chapter',
    ...ogName(chapter.title ?? chapter.filename),
    ...(chapterIcon ? { icon: chapterIcon } : {}),
  };
  const description = [`${count} quest${count === 1 ? '' : 's'}`, group]
    .filter(Boolean)
    .join(' · ');
  return { entity, description, imageQuery: ogImageQuery(entity, description) };
}

registerOgResolver('quest', questOgContext);
