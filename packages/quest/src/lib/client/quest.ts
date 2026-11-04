import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { clientDumpJson, clientDumpLang } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';
import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { loadDumpQuestIndex } from '@terrafirmagreg-team/quest/lib/data/load';
import { parseChapter } from '@terrafirmagreg-team/quest/lib/data/parse';
import type {
  Chapter,
  QuestCompactIndex,
} from '@terrafirmagreg-team/quest/lib/data/dto';
import type { QuestChapterRow } from '@terrafirmagreg-team/quest/lib/data/groups';

export type ClientQuestLocation = {
  filename: string;
  questId: string;
};

export async function findClientQuestLocation(
  dataset: DatasetRef,
  questId: string,
): Promise<ClientQuestLocation | undefined> {
  const index = await loadDumpQuestIndex(dataset);
  const row = index?.quests.find((quest) => quest.id === questId);
  return row ? { filename: row.filename, questId: row.id } : undefined;
}

const resolve = (
  map: Record<string, string>,
  key: string | undefined,
): string | undefined => (key ? (langString(map, key) ?? key) : key);

function normalize(data: QuestCompactIndex): QuestCompactIndex {
  return {
    title: data.title,
    openGuide: data.openGuide,
    ...(data.book ? { book: data.book } : {}),
    groups: data.groups ?? [],
    chapters: data.chapters ?? [],
    quests: (data.quests ?? []).map((row) => ({
      ...row,
      dependencies: row.dependencies ?? [],
      items: row.items ?? [],
      tasks: row.tasks ?? [],
      rewards: row.rewards ?? [],
    })),
  };
}

export const loadQuestCompactIndex = createDatasetCache(
  async (dataset: DatasetRef, lang: string): Promise<QuestCompactIndex> => {
    const [index, map] = await Promise.all([
      loadDumpQuestIndex(dataset),
      clientDumpLang(dataset, lang),
    ]);
    const base: QuestCompactIndex = index ?? {
      groups: [],
      chapters: [],
      quests: [],
    };
    return normalize({
      ...base,
      title: resolve(map, base.title),
      groups: base.groups.map((group) => ({
        ...group,
        title: resolve(map, group.title),
      })),
      chapters: base.chapters.map((chapter) => ({
        ...chapter,
        title: resolve(map, chapter.title),
      })),
      quests: base.quests.map((quest) => ({
        ...quest,
        title: resolve(map, quest.title),
        subtitle: resolve(map, quest.subtitle),
      })),
    });
  },
);

const chapterCache = createDatasetCache<
  [string, string, string | undefined],
  Chapter | undefined
>(
  async (
    dataset: DatasetRef,
    file: string,
    filename: string,
    defaultQuestShape?: string,
  ): Promise<Chapter | undefined> => {
    const raw = await clientDumpJson(dataset, file);
    return raw
      ? parseChapter(raw, { filename, defaultQuestShape })
      : undefined;
  },
  (dataset, _file, filename) => `${dataset.id}/${dataset.version ?? ''}${filename}`,
);

export function loadQuestChapter(
  dataset: DatasetRef,
  chapter: QuestChapterRow | undefined,
  defaultQuestShape?: string,
): Promise<Chapter | undefined> {
  if (!chapter?.file) return Promise.resolve(undefined);
  return chapterCache(
    dataset,
    chapter.file,
    chapter.filename,
    defaultQuestShape,
  );
}

export function loadQuestLangMap(
  dataset: DatasetRef,
  lang: string,
): Promise<Record<string, string>> {
  return clientDumpLang(dataset, lang);
}

