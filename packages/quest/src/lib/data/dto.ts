import type {
  ReferenceKind,
  TaggedReference,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type {
  ChapterImage,
  QuestEntry,
  QuestLink as QuestLinkWire,
  QuestReward as QuestRewardWire,
  QuestTask as QuestTaskWire,
} from '@terrafirmagreg-team/dump/lib/dump/gen';

export type { ChapterImage };

type WithoutIndex<T> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};

export type QuestTask = Omit<
  WithoutIndex<QuestTaskWire>,
  'count' | 'icon' | 'id' | 'items' | 'ref'
> & {
  id: string;
  items: string[];
  ref?: TaggedReference;
  count?: number;
  icon?: string;
  iconKind?: ReferenceKind;
};

export type QuestReward = Omit<
  WithoutIndex<QuestRewardWire>,
  'id' | 'items' | 'ref'
> & {
  id: string;
  items: string[];
  ref?: TaggedReference;
};

export type Quest = Omit<
  WithoutIndex<QuestEntry>,
  'dependencies' | 'icon' | 'rewards' | 'tasks' | 'x' | 'y'
> & {
  x: number;
  y: number;
  icon?: string;
  iconKind?: ReferenceKind;
  dependencies: string[];
  hideDependentLines?: boolean;
  tasks: QuestTask[];
  rewards: QuestReward[];
};

export type QuestLink = Omit<WithoutIndex<QuestLinkWire>, 'icon'> & {
  icon?: string;
};

export type Chapter = {
  id: string;
  filename: string;
  title?: string;
  subtitle?: string;
  description?: string[];
  icon?: string;
  iconKind?: ReferenceKind;
  group?: string;
  orderIndex: number;
  autofocusId?: string;
  defaultHideDependencyLines?: boolean;
  defaultQuestShape?: string;
  quests: Quest[];
  questLinks: QuestLink[];
  images: ChapterImage[];

  shapeTextures?: Record<string, { shape?: string; background?: string; outline?: string }>;
};

export type QuestCompactRow = {
  id: string;

  filename: string;
  title?: string;
  subtitle?: string;
  description?: string[];
  icon?: string;
  iconKind?: ReferenceKind;
  search?: string;
  items: string[];
  dependencies: string[];
  invisible?: boolean;
  optional?: boolean;
  hideDependencyLines?: boolean;
  hideDependentLines?: boolean;
  guidePage?: string;
  tasks?: QuestTask[];
  rewards?: QuestReward[];
};

export type QuestCompactChapter = {
  filename: string;

  file?: string;
  group?: string;
  title?: string;
  icon?: string;
  iconKind?: ReferenceKind;
  count: number;

  orderIndex?: number;
};

export type QuestCompactGroup = {
  id: string;
  title?: string;

  orderIndex?: number;
};

export type QuestBookMeta = {
  gridScale?: number;
  questSpacing?: number;
  defaultQuestShape?: string;
};

export type QuestCompactIndex = {
  title?: string;
  openGuide?: string;
  book?: QuestBookMeta;
  groups: QuestCompactGroup[];
  chapters: QuestCompactChapter[];
  quests: QuestCompactRow[];
};

