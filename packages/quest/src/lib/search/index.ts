import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { AdvancedIndex } from 'fumadocs-core/search/server';
import type { DumpIndex } from '@terrafirmagreg-team/dump/lib/dump/mods/dto';
import type {
  DataQuestsChapter,
  DataQuestsData,
  QuestEntry,
} from '@terrafirmagreg-team/dump/lib/dump/gen';
import { plainQuestText } from '@terrafirmagreg-team/quest/lib/rich-text';
import { questHref } from '@terrafirmagreg-team/quest/lib/links';
import { humanizeKey } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';

export type QuestIndex = AdvancedIndex & { locale: string };

export interface DumpSource {
  getJson(rel: string): Promise<unknown | undefined>;
  getLang(lang: string): Promise<Record<string, string>>;
}

function questTitle(
  quest: QuestEntry,
  map: Record<string, string>,
): string | undefined {
  const text = plainQuestText(quest.title, map).trim();
  if (text && !(text.startsWith('{') && text.endsWith('}'))) return text;
  return humanizeKey(quest.id);
}

function questContents(
  quest: QuestEntry,
  title: string,
  map: Record<string, string>,
): { heading: string; content: string }[] {
  const raw = [
    plainQuestText(quest.subtitle, map),
    ...(quest.description ?? []).map((line) => plainQuestText(line, map)),
    ...Object.values(quest.tasks ?? {}).map((task) =>
      plainQuestText(task?.title, map),
    ),
  ];
  return raw
    .map((content) => content.trim())
    .filter(Boolean)
    .map((content) => ({ heading: title, content }));
}

function questIndex(
  dataset: DatasetRef,
  namespace: string,
  chapterId: string,
  questId: string,
  quest: QuestEntry,
  chapterTitle: string | undefined,
  map: Record<string, string>,
  lang: string,
): QuestIndex | null {
  const title = questTitle(quest, map);
  const contents = questContents(quest, title ?? questId, map);
  if (!title && !contents.length) return null;
  const refKey = `${dataset.id}/${dataset.version ?? ''}`;
  return {
    title: title ?? questId,
    url: questHref(dataset, undefined, {
      category: chapterId,
      id: questId,
    }),
    id: `quest:${refKey}:${namespace}:${questId}:${lang}`,
    tag: `quest:${refKey}`,
    locale: lang,
    structuredData: {
      headings: chapterTitle
        ? [{ id: chapterId, content: chapterTitle }]
        : [],
      contents,
    },
  };
}

export async function questSearchIndexes(
  dataset: DatasetRef,
  dump: DumpIndex,
  source: DumpSource,
): Promise<QuestIndex[]> {
  const langs = dump.manifest.languages?.length
    ? dump.manifest.languages
    : ['en_us'];
  const maps = new Map(
    await Promise.all(
      langs.map(
        async (lang) => [lang, await source.getLang(lang)] as const,
      ),
    ),
  );
  const out: QuestIndex[] = [];
  for (const mod of dump.mods) {
    if (!mod.questData) continue;
    const data = (await source.getJson(mod.questData)) as
      | DataQuestsData
      | undefined;
    if (!data?.chapters) continue;
    const chapterDocs = new Map<
      string,
      DataQuestsChapter | undefined
    >();
    await Promise.all(
      Object.values(data.chapters).map(async (summary) => {
        if (!summary?.file) return;
        chapterDocs.set(
          summary.file,
          (await source.getJson(
            `data/${mod.namespace}/quests/${summary.file}`,
          )) as DataQuestsChapter | undefined,
        );
      }),
    );
    for (const [chapterId, summary] of Object.entries(data.chapters)) {
      const chapter = summary?.file
        ? chapterDocs.get(summary.file)
        : undefined;
      if (!chapter?.quests) continue;
      const quests = chapter.quests;
      const chapterTitle = (map: Record<string, string>) =>
        plainQuestText(chapter.title ?? summary?.title, map).trim() ||
        undefined;
      for (const [questId, quest] of Object.entries(quests)) {
        if (!quest || quest.invisible === true) continue;
        for (const lang of langs) {
          const map = maps.get(lang) ?? {};
          const index = questIndex(
            dataset,
            mod.namespace,
            chapterId,
            questId,
            quest,
            chapterTitle(map),
            map,
            lang,
          );
          if (index) out.push(index);
        }
      }
    }
  }
  return out;
}

