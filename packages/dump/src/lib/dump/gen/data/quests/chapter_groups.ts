export interface DataQuestsChapterGroups {
  chapterGroups: {
    [k: string]: QuestChapterGroup | undefined;
  };
  schema: "data/quests/chapter_groups";
}
export interface QuestChapterGroup {
  id: string;
  orderIndex?: number;
  title?: string;
}

