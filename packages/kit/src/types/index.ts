import type { DatasetRef, SectionKey } from '@terrafirmagreg-team/sites/location';
import type * as PageTree from 'fumadocs-core/page-tree';
import type { ComponentType } from 'react';
import type { IconName } from 'lucide-react/dynamic';
import type { Page } from 'fumadocs-core/source';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export type { SectionKey } from '@terrafirmagreg-team/sites/location';

export type SectionUrl = string;

export type SectionDataset = {
  id: string;
  title?: string;
  description?: string;
  icon?: IconName;
  accent?: string;

  versions?: string[];

  languages?: Lang[];
};

export type DatasetCatalog = Record<SectionKey, SectionDataset[]>;

export type LeftSidebarScope = {
  section: SectionKey;
  catalog: DatasetCatalog;
};

export type LeftSidebarSlotProps = LeftSidebarScope & {

  feature?: ComponentType;
};

export type SectionTrees = Record<Lang, Record<string, PageTree.Root>>;

export type SectionPage = {
  data: {
    title: string;
    description?: string;
    full?: boolean;
    comments?: boolean;
    redirect?: string;
    authors?: string[];
    gitChangelog?:
      | boolean
      | {
          disableChangelog?: boolean;
          disableContributors?: boolean;
        };
    load?(): Promise<unknown>;
    content?: string;
    structuredData?: unknown;
    frontmatter?: Record<string, unknown>;
  };
  path: string;
  slugs: string[];
  url: string;
  locale?: string;
};

export type SectionSource = {
  getPage(slugs: string[] | undefined, language?: string): unknown;
  getPages(language?: string): Page[];
  getPageTree(locale?: string): PageTree.Root;
  getNodeMeta?(
    node: PageTree.Folder | PageTree.Root,
    language?: string,
  ): unknown;
};

export type DatasetLanding = {
  title: string;
  description?: string;
  dataset: DatasetRef;
  datasetTitle?: string;
  lang: Lang;
  versions?: string[];
};

export type SectionSourceEntry = {
  getSource: () => Promise<SectionSource>;
  getSourceSync?: () => SectionSource | undefined;
  markdown: { page(page: unknown): Promise<string> };
};

