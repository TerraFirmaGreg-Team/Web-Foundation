import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type {
  SectionKey,
  SectionSourceEntry,
} from '@terrafirmagreg-team/kit/types';
import type { DatasetLink } from './dataset-links';

export type SectionDump = {
  manifest: {
    languages?: readonly string[];
    pack?: { version?: string | null } | null;
  };
  mods: readonly {
    namespace: string;
    books: readonly unknown[];
    questData: string | null;
    recipeCategories: string | null;
    recipeIndex: string | null;
  }[];
};

export type SectionConfigInput = {

  appName: string;
  basePath: string;
  siteUrl: string;
  previewRoute: string;
  docsRoute: string;

  git?: {
    user: string;
    repo: string;
    branch: string;
  };

  sectionAccent?: Partial<Record<SectionKey, string>>;

  languages?: readonly string[];

  datasetConfig: Record<
    string,
    {
      accent?: string;
      order?: number;

      crowdin?: {
        url: string;
        excludeUsers?: readonly string[];
        minWords?: number;
      };

      github?: {
        repo?: `${string}/${string}`;
        url?: string;
        excludeUsers?: readonly string[];
        minContributions?: number;
        mergeUsers?: Record<string, string>;
        discussions?: { repoId: string; categoryId: string };
      };

      links?: readonly DatasetLink[];

      sections?: Partial<{
        [K in SectionKey]: K extends 'guide'
          ? true | { bookOrder?: readonly string[] }
          : true | Record<string, never>;
      }>;
    }
  >;
  sources: Partial<Record<SectionKey, SectionSourceEntry>>;

  dump?: {
    discoverDatasets(): Promise<DatasetRef[]>;
    loadDataset(ref: DatasetRef): Promise<SectionDump | null | undefined>;
    hasContent: Record<string, (dump: SectionDump) => boolean>;
  };
};

const registry = ((globalThis as Record<symbol, unknown>)[
  Symbol.for('terrafirmagreg.config')
] ??= new Map<string, unknown>()) as Map<string, unknown>;

export function registerSectionConfig(
  input: Partial<SectionConfigInput>,
): void {
  registry.set('section', {
    ...(registry.get('section') as SectionConfigInput | undefined),
    ...input,
  });
}

export function sectionConfig(): SectionConfigInput {
  const config = registry.get('section') as SectionConfigInput | undefined;
  if (!config) {
    throw new Error(
      'Section config is not registered: call registerSectionConfig() at app startup.',
    );
  }
  return config;
}

export interface LayoutDeps {
  trackView?: (pathname: string) => void;
  commentsMenuItem?: () => unknown;
  loadSectionTree?: (
    section: string,
    datasetId: string,
    lang: string,
  ) => Promise<import('fumadocs-core/page-tree').Root | null>;
}

export function registerLayoutDeps(input: LayoutDeps): void {
  registry.set('layoutDeps', input);
}

export function layoutDeps(): LayoutDeps {
  return (registry.get('layoutDeps') as LayoutDeps | undefined) ?? {};
}

export type ClientDumpLoader = {
  loadDump(dataset: DatasetRef): Promise<SectionDump | null | undefined>;
  loadVersions(
    datasetId: string,
  ): Promise<{ latest?: string; versions: string[] } | null>;
  warm?(dataset: DatasetRef): void;
};

export const {
  register: registerClientDumpLoader,
  get: clientDumpLoader,
} = createConfig<ClientDumpLoader>('ClientDump');

export function createConfig<T>(label: string) {
  return {
    register(input: T) {
      registry.set(label, input);
    },
    get(): T {
      const config = registry.get(label) as T | undefined;
      if (!config) {
        throw new Error(
          `${label} config is not registered: call register${label}Config() at app startup.`,
        );
      }
      return config;
    },
  };
}

