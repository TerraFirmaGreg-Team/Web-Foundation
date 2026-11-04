import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { DatasetLanding } from '@terrafirmagreg-team/kit/types';
import type { DumpText } from '@terrafirmagreg-team/dump/lib/dump/contract/text';
import type {
  ReferenceKind,
  TaggedReference,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { GuidePage } from '@terrafirmagreg-team/guide/lib/data/dto';
import type { AtlasBundle } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/dto';
import type { EmbedRecipe } from '@terrafirmagreg-team/kit/types/embeds';
import type { DumpEntityEntry } from '@terrafirmagreg-team/dump/lib/dump/data/registry/dto';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';

export type {
  GuideMultiblock,
  GuidePage,
  GuideTableCell,
  GuideTableLegend,
} from '@terrafirmagreg-team/guide/lib/data/dto';

export type GuideEntry = {
  id: string;
  name?: string;
  category?: string;
  icon?: TaggedReference;
  pages?: GuidePage[];
  order?: number;
  contentLanguage?: Lang;

  translation?: 'untranslated' | 'partial';
};

export type GuideEntryRef = {
  id: string;
  name: string;
  icon?: TaggedReference;
  pageCount?: number;
  order?: number;
  translation?: 'untranslated' | 'partial';
};

export type GuideCategory = {
  id: string;
  name: string;
  description?: string;
  icon?: TaggedReference;
  entries: GuideEntryRef[];
  order?: number;
  translation?: 'untranslated' | 'partial';
};

export type GuideBook = {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  landing: DumpText[];
  landingText?: string;
  cover: TaggedReference | null;
  macros?: Record<string, string>;
  translation?: 'untranslated' | 'partial';
};

export type GuideIndex = {
  status: 'missing' | 'ready';
  root: string;
  modId: string;
  bookId?: string;
  bookPath?: string;
  bookSlug?: string;
  book: GuideBook | null;
  categories: GuideCategory[];
  entries: GuideEntry[];
  language: Lang;
  isFallback: boolean;
};

type GuideMultiblockDef = {
  id: string;
  pattern?: string[][];
  mapping?: Record<string, unknown>;
  glb?: string;
  error?: string | null;
};

type GuideEntityRender = {
  path?: string;
  scale?: number;
  offset?: number;
  width?: number;
  height?: number;
};

export type GuideBookMeta = {
  bookId?: string;
  name?: string;
  multiblockDefs?: GuideMultiblockDef[];
  entityRenders?: Record<string, GuideEntityRender>;
};

export type GuideFormatNode =
  | {
      type: 'text';
      value: string;
      styles: string[];
      color?: string;
      link?: string;
      tooltip?: string;
    }
  | { type: 'break' }
  | { type: 'keybind'; value: string }
  | { type: 'command'; value: string; label?: string };

export type GuideFormatOptions = {
  dataset?: DatasetRef;
  lang?: Lang;
  modId?: string;
  bookPath?: string;
  categoryByEntry?: Map<string, string>;
  macros?: Record<string, string>;
  langMap?: Record<string, string>;
  keybinds?: Record<string, string>;
  questLinks?: Record<string, { filename: string; questId: string }>;
  previews?: Record<string, PagePreviewData>;
};

export type GuideCategoryRef = {
  id: string;
};

type GuideReferenceKind = 'guide' | 'recipe' | 'quest';

export type GuideReference = {
  kind: GuideReferenceKind;
  id: string;
  anchor?: string;
};

export type ResolvedGuideReference = GuideReference & {
  href?: string;
  available: boolean;
};

export type GuideReferenceContext = {
  dataset: DatasetRef;
  lang: Lang;
  modId: string;
  bookPath: string;
  categoryByEntry: Map<string, string>;
  questLinks?: Record<string, { filename: string; questId: string }>;
  targets?: Partial<
    Record<'recipe' | 'quest', (id: string) => string | undefined>
  >;
};

export type GuideTocLabels = {
  related?: string;
  objective?: string;
};

export type GuidePageKind = 'pack' | 'overview' | 'category' | 'entry';

export type GuidePageData = DatasetLanding;

export type PageRendererProps = {
  dataset: DatasetRef;
  lang: Lang;
  bookPath: string;
  page: GuidePage;
  atlases?: Record<string, AtlasBundle>;
  meta: GuideBookMeta;
  bookModId: string;
  categoryByEntry: Map<string, string>;
  langMap: Record<string, string>;
  entryRefs: Map<string, GuideEntryRef>;
  keybinds?: Record<string, string>;
  book?: GuideBook | null;
  extras?: GuideEntryExtras;
  questLinks?: Record<string, { filename: string; questId: string }>;
  previews?: Record<string, PagePreviewData>;
  messages: GuideMessages;
};

export type GuideMessages = Record<string, string>;

export type GuideEntryExtras = {
  atlases: Record<string, AtlasBundle>;
  keybinds: Record<string, string>;
  recipes: Record<string, EmbedRecipe>;
  entities: Record<string, DumpEntityEntry>;
  entityNames: Record<string, string>;
  glbs: Record<string, string>;
};

export type GuidePagePayload = {
  kind: GuidePageKind;
  dataset: DatasetRef;
  lang: Lang;
  title: string;
  modId?: string;
  bookPath?: string;
  description?: string;
  previewIcon?: string;
  previewKind?: ReferenceKind;
  categoryId?: string;
  bookModId?: string;
  book?: GuideBook | null;
  categories?: GuideCategory[];
  entries?: GuideEntry[];
  entry?: GuideEntry;
  extras?: GuideEntryExtras;
  questLinks?: Record<string, { filename: string; questId: string }>;
  previews?: Record<string, PagePreviewData>;
  messages: GuideMessages;
};

