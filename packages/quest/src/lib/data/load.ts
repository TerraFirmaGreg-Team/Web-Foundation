import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { asNumber, asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { asTaggedReference, stackIdFromRef } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { loadDatasetDump } from '@terrafirmagreg-team/dump/lib/dump/mods/load';
import { clientDumpJson } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { joinDumpRel } from '@terrafirmagreg-team/dump/lib/dump/paths';
import {
  compactRowFromQuest,
  parseChapter,
} from '@terrafirmagreg-team/quest/lib/data/parse';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';
import type {
  QuestBookMeta,
  QuestCompactIndex,
} from '@terrafirmagreg-team/quest/lib/data/dto';

function questBookMeta(
  defaults: Record<string, unknown> | undefined,
): QuestBookMeta | undefined {
  if (!defaults) return undefined;
  const gridScale = asNumber(defaults.gridScale);
  const questSpacing = asNumber(defaults.questSpacing);
  const defaultQuestShape = asString(defaults.defaultQuestShape);
  if (
    gridScale === undefined &&
    questSpacing === undefined &&
    !defaultQuestShape
  ) {
    return undefined;
  }
  return {
    ...(gridScale !== undefined ? { gridScale } : {}),
    ...(questSpacing !== undefined ? { questSpacing } : {}),
    ...(defaultQuestShape ? { defaultQuestShape } : {}),
  };
}

type QuestMeta = {
  index: QuestCompactIndex;
  chapterRels: { key: string; fileRel: string | null }[];
};

async function questMeta(dataset: DatasetRef): Promise<QuestMeta | undefined> {
  const dump = await loadDatasetDump(dataset);
  const questRoots = dump?.manifest.indexes.quests ?? {};
  if (!dump || !Object.keys(questRoots).length) return undefined;

  const index: QuestCompactIndex = { groups: [], chapters: [], quests: [] };
  const chapterRels: QuestMeta['chapterRels'] = [];
  for (const dataRel of Object.values(questRoots)) {
    if (!dataRel) continue;
    const data = asRecord(await clientDumpJson(dataset, dataRel, 'high'));
    if (!data) continue;
    const defaults = asRecord(data.defaults);
    index.book ??= questBookMeta(defaults);
    index.title ??= asString(data.title);
    index.openGuide ??= asString(defaults?.openGuide);

    const groupsRel = joinDumpRel(dataRel, 'chapter_groups.json');
    const groupsDoc = asRecord(await clientDumpJson(dataset, groupsRel, 'high'));
    const chapterGroups = asRecord(groupsDoc?.chapterGroups);
    for (const [key, groupRaw] of Object.entries(chapterGroups ?? {})) {
      const row = asRecord(groupRaw);
      const id = asString(row?.id) ?? key;
      const orderIndex = asNumber(row?.orderIndex);
      if (id)
        index.groups.push({
          id,
          title: asString(row?.title),
          ...(orderIndex !== undefined ? { orderIndex } : {}),
        });
    }

    const chapters = asRecord(data.chapters);
    for (const [chapterKey, summaryRaw] of Object.entries(chapters ?? {})) {
      const summary = asRecord(summaryRaw);
      const file = asString(summary?.file);
      const fileRel = file ? joinDumpRel(dataRel, file) : undefined;
      const iconRef = asTaggedReference(summary?.icon);
      const group = asString(summary?.group);
      const orderIndex = asNumber(summary?.orderIndex);
      index.chapters.push({
        filename: chapterKey,
        ...(fileRel ? { file: fileRel } : {}),
        title: asString(summary?.title),
        ...(iconRef
          ? { icon: stackIdFromRef(iconRef), iconKind: iconRef.kind }
          : {}),
        count: asNumber(summary?.count) ?? 0,
        ...(group ? { group } : {}),
        ...(orderIndex !== undefined ? { orderIndex } : {}),
      });
      chapterRels.push({ key: chapterKey, fileRel: fileRel ?? null });
    }
  }
  return { index, chapterRels };
}

function sortGroups(index: QuestCompactIndex) {
  const position = new Map(index.groups.map((group, i) => [group, i]));
  index.groups.sort(
    (a, b) =>
      (a.orderIndex ?? Number.MAX_SAFE_INTEGER) -
        (b.orderIndex ?? Number.MAX_SAFE_INTEGER) ||
      (position.get(a) ?? 0) - (position.get(b) ?? 0),
  );
}

const summaryCache = createDatasetCache(
  async (dataset: DatasetRef): Promise<QuestCompactIndex | undefined> => {
    const meta = await questMeta(dataset);
    if (!meta) return undefined;
    sortGroups(meta.index);
    return meta.index;
  },
);

export function loadDumpQuestSummary(
  dataset: DatasetRef,
): Promise<QuestCompactIndex | undefined> {
  return summaryCache(dataset);
}

export function questSummaryComplete(index: QuestCompactIndex): boolean {
  return index.chapters.every(
    (chapter) =>
      chapter.orderIndex !== undefined || chapter.group !== undefined,
  );
}

const indexCache = createDatasetCache(
  async (dataset: DatasetRef): Promise<QuestCompactIndex | undefined> => {
    const meta = await questMeta(dataset);
    if (!meta) return undefined;
    const { index, chapterRels } = meta;
    const chapterDocs = await Promise.all(
      chapterRels.map((row) => clientDumpJson(dataset, row.fileRel, 'high')),
    );
    chapterRels.forEach(({ key }, i) => {
      const row = index.chapters[index.chapters.length - chapterRels.length + i];
      const chapter = parseChapter(chapterDocs[i], {
        filename: key,
        defaultQuestShape: index.book?.defaultQuestShape,
      });
      if (!chapter) return;
      if (row) {
        row.orderIndex = chapter.orderIndex;
        if (chapter.group) row.group = chapter.group;
      }
      for (const quest of chapter.quests) {
        index.quests.push(compactRowFromQuest(quest, key));
      }
    });
    sortGroups(index);
    return index;
  },
);

export function loadDumpQuestIndex(
  dataset: DatasetRef,
): Promise<QuestCompactIndex | undefined> {
  return indexCache(dataset);
}

