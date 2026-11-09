import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { stripMcFormat } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import {
  ogIconSprite,
  ogRefSprite,
  ogStackName,
} from '@terrafirmagreg-team/dump/lib/dump/assets/og';
import {
  ogName,
  registerOgResolver,
  type OgContext,
} from '@terrafirmagreg-team/preview/lib';
import { loadQuestCompactIndex } from './client/quest';

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
    return {
      entity: {
        kind: 'quest',
        ...ogName(quest.title ?? quest.id),
        id: quest.id,
      },
      icon: await ogIconSprite(dataset, quest.icon, quest.iconKind),
      description: quest.subtitle
        ? stripMcFormat(quest.subtitle).trim()
        : undefined,
      imageQuery: `id=${encodeURIComponent(questId)}`,
    };
  }
  const item = search.get('item');
  if (item) {
    const count = index.quests.filter((row) =>
      row.items.includes(item),
    ).length;
    return {
      entity: {
        kind: 'item',
        name: await ogStackName(dataset, item, 'item', lang),
        id: item,
      },
      icon: await ogRefSprite(dataset, { kind: 'item', id: item }),
      description: `${count} quest${count === 1 ? '' : 's'}`,
      imageQuery: `item=${encodeURIComponent(item)}`,
    };
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
  return {
    entity: {
      kind: 'chapter',
      ...ogName(chapter.title ?? chapter.filename),
    },
    icon: await ogIconSprite(dataset, chapter.icon, chapter.iconKind),
    description: [`${count} quest${count === 1 ? '' : 's'}`, group]
      .filter(Boolean)
      .join(' · '),
    imageQuery: `category=${encodeURIComponent(category)}`,
  };
}

registerOgResolver('quest', questOgContext);
