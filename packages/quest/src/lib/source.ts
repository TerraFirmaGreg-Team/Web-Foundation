import {
  loadQuestChapter,
  loadQuestCompactIndex,
  loadQuestLangMap,
} from '@terrafirmagreg-team/quest/lib/client/quest';
import { loadDumpQuestIndex } from '@terrafirmagreg-team/quest/lib/data/load';

export function getQuestSource() {
  return {
    index: loadQuestCompactIndex,
    chapter: loadQuestChapter,
    langMap: loadQuestLangMap,
    dumpIndex: loadDumpQuestIndex,
  };
}

export type QuestSource = ReturnType<typeof getQuestSource>;
