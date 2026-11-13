import 'server-only';
import { createElement } from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/load';
import { clientDumpLangQuest } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { getQuestSource } from '@terrafirmagreg-team/quest/lib/source';
import {
  loadDumpQuestSummary,
  questSummaryComplete,
} from '@terrafirmagreg-team/quest/lib/data/load';
import { DUMP_POINTER_TTL } from '@terrafirmagreg-team/dump/lib/dump/json-reader';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';
import { groupQuestChapters } from '@terrafirmagreg-team/quest/lib/data/groups';
import { keyTreeNode } from '@terrafirmagreg-team/translate/server';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { encodeQueryValue } from '@terrafirmagreg-team/translate/lib/url';
import {
  type DatasetRef,
  sectionUrl,
  versionSuffix,
} from '@terrafirmagreg-team/sites/location';
import { renderRichInline } from '@terrafirmagreg-team/quest/components/rich-text';
import { sectionDatasets } from '@terrafirmagreg-team/kit/lib/datasets';
import type { QuestChapterRow } from '@terrafirmagreg-team/quest/lib/data/groups';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { SectionTrees } from '@terrafirmagreg-team/kit/types';

const UNGROUPED_FOLDER = '_ungrouped';

function groupFolderId(id: string): string {
  return id.replaceAll(/[\\/]/g, '_') || UNGROUPED_FOLDER;
}

function chapterIcon(
  dataset: DatasetRef,
  chapter: QuestChapterRow,
): React.ReactNode {
  if (!chapter.icon) return undefined;
  return createElement(
    'span',
    {
      key: 'icon',
      'data-icon': true,
      className:
        'inline-flex size-3.5 shrink-0 items-center justify-center overflow-hidden',
    },
    createElement(Entry, {
      dataset,
      id: chapter.icon,
      kind: chapter.iconKind,
      name: chapter.filename,
      size: 14,
      href: false,
      tooltip: false,
      missing: 'hide',
    }),
  );
}

function chapterLeaf(
  dataset: DatasetRef,
  chapter: QuestChapterRow,
  map: Record<string, string>,
): PageTree.Item {
  return keyTreeNode({
    type: 'page',
    name: renderRichInline(
      langString(map, chapter.title) ?? chapter.filename,
      map,
    ),
    url: `${sectionUrl('quest', dataset.id)}?category=${encodeQueryValue(chapter.filename)}${versionSuffix(dataset)}`,
    icon: chapterIcon(dataset, chapter),
    $id: `${dataset.id}/${dataset.version ?? ''}/category/${chapter.filename}`,
  }) as PageTree.Item;
}

const questTreesCache = createAsyncCache(
  (lang: Lang): Promise<SectionTrees> => buildQuestTrees(lang),
  (lang) => `quest-trees/${lang}`,
  DUMP_POINTER_TTL,
);

export function questTrees(lang: Lang): Promise<SectionTrees> {
  return questTreesCache(lang);
}

async function buildQuestTrees(lang: Lang): Promise<SectionTrees> {
  const { defaultLanguage } = loadLocaleRegistry();
  const datasets = await sectionDatasets('quest');
  const trees: SectionTrees = {};
  for (const { id, title: datasetTitle, languages } of datasets) {
    if (!(languages ?? [defaultLanguage]).includes(lang)) continue;
    const ref = { id };
    const map = await clientDumpLangQuest(ref, lang);
    const summary = await loadDumpQuestSummary(ref);
    const index =
      summary && questSummaryComplete(summary)
        ? summary
        : await getQuestSource().dumpIndex(ref);
    const groups = index ? groupQuestChapters(index) : [];
    const children: PageTree.Node[] = groups.flatMap(
      (group): PageTree.Node[] =>
        group.id
          ? [
              {
                type: 'folder',
                name: renderRichInline(
                  langString(map, group.title) ?? group.id,
                  map,
                ),
                defaultOpen: true,
                $id: `${id}/group/${groupFolderId(group.id)}`,
                children: group.chapters.map((chapter) =>
                  chapterLeaf({ id }, chapter, map),
                ),
              },
            ]
          : group.chapters.map((chapter) => chapterLeaf({ id }, chapter, map)),
    );
    (trees[lang] ??= {})[id] = {
      name: datasetTitle ?? id,
      children,
      $id: `quest/${id}/${lang}`,
    } satisfies PageTree.Root;
  }
  return trees;
}

