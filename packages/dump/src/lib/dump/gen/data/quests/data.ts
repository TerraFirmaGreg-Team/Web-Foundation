export type ResourceId = string;
export type ReferenceKind =
  | "item"
  | "block"
  | "fluid"
  | "entity"
  | "itemTag"
  | "blockTag"
  | "fluidTag"
  | "entityTag"
  | "texture"
  | "model"
  | "recipe";

export interface DataQuestsData {
  chapters: {
    [k: string]: QuestChapterSummary | undefined;
  };
  defaults: {
    [k: string]: JsonNode | undefined;
  };
  icon?: TaggedReference;
  schema: "data/quests/data";
  title?: string;
}
export interface QuestChapterSummary {
  count: number;
  file: string;
  icon?: TaggedReference;
  id?: string;
  title?: string;
}
export interface TaggedReference {
  id: ResourceId;
  kind: ReferenceKind;
  tag?: JsonNode;
}
export interface JsonNode {
  [k: string]: unknown | undefined;
}

