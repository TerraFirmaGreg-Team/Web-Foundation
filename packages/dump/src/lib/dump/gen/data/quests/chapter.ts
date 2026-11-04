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

export interface DataQuestsChapter {
  autofocusId?: string;
  defaultHideDependencyLines?: boolean;
  defaultQuestShape?: string;
  description?: string[];
  filename?: string;
  group?: string;
  icon?: TaggedReference;
  id?: string;
  images?: ChapterImage[];
  orderIndex?: number;
  questLinks?: {
    [k: string]: QuestLink | undefined;
  };
  quests?: {
    [k: string]: QuestEntry | undefined;
  };
  schema?: "data/quests/chapter";
  subtitle?: string;
  title?: string;
  [k: string]: unknown | undefined;
}
export interface TaggedReference {
  id: ResourceId;
  kind: ReferenceKind;
  tag?: JsonNode;
}
export interface JsonNode {
  [k: string]: unknown | undefined;
}
export interface ChapterImage {
  alignToCorner?: boolean;
  alpha?: number;
  animated?: boolean;
  click?: string;
  color?: number;
  frameCount?: number;
  frameH?: number;
  frameSequence?: number[];
  frameTime?: number;
  frameW?: number;
  h: number;
  image: string;
  rotation?: number;
  w: number;
  x: number;
  y: number;
  [k: string]: unknown | undefined;
}
export interface QuestLink {
  icon?: TaggedReference;
  id: string;
  linkedQuest: string;
  shape?: string;
  size?: number;
  x: number;
  y: number;
  [k: string]: unknown | undefined;
}
export interface QuestEntry {
  canRepeat?: boolean;
  dependencies?: string[];
  description?: string[];
  guidePage?: string;
  hideDependencyLines?: boolean;
  icon?: TaggedReference;
  id: string;
  image?: string;
  invisible?: boolean;
  minWidth?: number;
  optional?: boolean;
  rewards?: {
    [k: string]: QuestReward | undefined;
  };
  shape?: string;
  size?: number;
  subtitle?: string;
  tasks?: {
    [k: string]: QuestTask | undefined;
  };
  title?: string;
  x?: number;
  y?: number;
  [k: string]: unknown | undefined;
}
export interface QuestReward {
  count?: number;
  id?: string;
  items?: TaggedReference[];
  ref?: TaggedReference;
  title?: string;
  type: string;
  xp?: number;
  [k: string]: unknown | undefined;
}
export interface QuestTask {
  biome?: string;
  count?: number;
  dimension?: string;
  filter?: string;
  filterRaw?: string;
  icon?: TaggedReference;
  id?: string;
  itemFilter?: string;
  items?: TaggedReference[];
  optional?: boolean;
  ref?: TaggedReference;
  stage?: string;
  title?: string;
  type: string;
  [k: string]: unknown | undefined;
}

