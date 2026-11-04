import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type * as PageTree from 'fumadocs-core/page-tree';
import { flattenTree } from 'fumadocs-core/page-tree';
import { LangRedirect } from '@terrafirmagreg-team/ui/components/blocks/lang/redirect';
import { LangContentSwitch } from '@terrafirmagreg-team/ui/components/blocks/lang/content';
import {
  Workspace,
  type WorkspaceProps,
} from '@terrafirmagreg-team/kit/components/workspace';
import { baseOptions } from '@terrafirmagreg-team/kit/lib/layout';
import {
  datasetCatalog,
  defaultDataset,
  findDataset,
  sectionDatasets,
} from '@terrafirmagreg-team/kit/lib/datasets';
import {
  generateDatasetLandingParams,
  getDatasetLanding,
} from '@terrafirmagreg-team/kit/lib/landing';
import {
  generateDatasetParams,
  getPage,
  resolvePage,
  sectionMetadata,
} from '@terrafirmagreg-team/kit/lib/page';
import {
  localeLoader,
  registerLocaleRenderer,
} from '@terrafirmagreg-team/kit/lib/locale/renderer';
import { canonicalUrl } from '@terrafirmagreg-team/kit/lib/urls';
import {
  renderSectionWorkspace,
  type SectionWorkspaceProps,
} from '@terrafirmagreg-team/kit/components/views/section';
import { sectionUrl } from '@terrafirmagreg-team/sites/location';
import { langContent, loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import type {
  DatasetCatalog,
  DatasetLanding,
  SectionDataset,
  SectionKey,
  SectionPage,
  SectionSource,
  SectionTrees,
} from '@terrafirmagreg-team/kit/types';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export interface SectionLayoutViewProps {
  section: SectionKey;
  trees: SectionTrees;
  catalog: DatasetCatalog;
  useTree?: (tree: PageTree.Root) => PageTree.Root;
  sidebar?: { feature?: ComponentType };
  navTitle?: ComponentType<ComponentProps<'a'>>;
  children?: ReactNode;
}

export interface SectionLandingView {
  node: ReactNode;
  workspace?: WorkspaceProps;
}

export interface SectionRoutesOptions<S extends SectionKey> {
  section: S;
  trees?: () => Promise<SectionTrees>;
  source?: {
    getSource: () => Promise<SectionSource>;
    contentDir: string;
    history?: boolean;
  };
  sidebar?: {
    feature?: ComponentType;
    useTree?: (tree: PageTree.Root) => PageTree.Root;
  };
  layout: ComponentType<SectionLayoutViewProps>;
  landing?: (
    page: DatasetLanding,
    lang: Lang,
  ) => SectionLandingView | Promise<SectionLandingView>;
  page?: ComponentType<SectionWorkspaceProps>;
}

interface RouteParams {
  params: Promise<{ slug?: string[] }>;
}

type Resolved = { page: unknown; isFallback: boolean } | undefined;

export function createSectionRedirect(section: SectionKey) {
  return async function Page() {
    const dataset = await defaultDataset(section);
    if (!dataset) notFound();
    return <LangRedirect to={sectionUrl(section, dataset)} />;
  };
}

export function createSectionRoutes<S extends SectionKey>({
  section,
  trees,
  source,
  sidebar,
  layout: LayoutView,
  landing,
  page: PageView,
}: SectionRoutesOptions<S>) {
  const resolve =
    (src: SectionSource | undefined, datasets: readonly SectionDataset[]) =>
    (slug: string[] | undefined, lang: Lang): Resolved => {
      if (slug?.length === 1) {
        if (!findDataset(datasets, { id: slug[0] })) return undefined;
        if (landing) {
          const page = getDatasetLanding(section, slug, lang, datasets);
          if (!page) return undefined;
          if (!src) return { page, isFallback: false };
          const own = src
            .getPages()
            .some(
              (p) =>
                p.slugs[0] === slug[0] &&
                ((p as SectionPage).locale ?? p.slugs[1]) === lang,
            );
          return { page, isFallback: !own };
        }
      }
      return src ? resolvePage(src, slug, lang) : undefined;
    };

  const render = async (
    src: SectionSource | undefined,
    slug: string[] | undefined,
    resolvedTrees: SectionTrees | undefined,
    catalog: DatasetCatalog,
    page: unknown,
    lang: Lang,
  ): Promise<ReactNode> => {
    if (slug?.length === 1 && landing) {
      const view = await landing(page as DatasetLanding, lang);
      return <Workspace {...view.workspace}>{view.node}</Workspace>;
    }
    if (!src || !PageView) return null;
    return renderSectionWorkspace({
      source: src,
      slug,
      contentDir: source?.contentDir ?? `content/${section}`,
      trees: resolvedTrees,
      catalog,
      history: source?.history,
      workspace: PageView,
      page: page as SectionPage,
      lang,
    });
  };

  registerLocaleRenderer(section, {
    resolve: async (slug, lang) =>
      resolve(await source?.getSource(), await sectionDatasets(section))(
        slug,
        lang,
      ),
    render: async (page, slug, lang) =>
      render(
        await source?.getSource(),
        slug,
        await trees?.(),
        await datasetCatalog(),
        page,
        lang,
      ),
  });

  async function SectionLayout({ children }: { children?: ReactNode }) {
    const { slots } = baseOptions();
    const [resolvedTrees, catalog] = await Promise.all([
      trees ? trees() : Promise.resolve<SectionTrees>({}),
      datasetCatalog(),
    ]);
    return (
      <LayoutView
        section={section}
        trees={resolvedTrees}
        catalog={catalog}
        useTree={sidebar?.useTree}
        sidebar={{ feature: sidebar?.feature }}
        navTitle={slots?.navTitle}
      >
        {children}
      </LayoutView>
    );
  }

  async function Page({ params }: RouteParams) {
    const { slug } = await params;
    const [src, datasets] = await Promise.all([
      source?.getSource(),
      sectionDatasets(section),
    ]);

    if (slug?.length === 1 && src && !landing) {
      const { defaultLanguage } = loadLocaleRegistry();
      if (!getPage(src, slug, defaultLanguage)) {
        const resolvedTrees = trees ? await trees() : undefined;
        const first = flattenTree(
          resolvedTrees?.[defaultLanguage]?.[slug[0]]?.children ?? [],
        )[0];
        if (first) return <LangRedirect to={first.url} />;
      }
    }

    const [resolvedTrees, catalog] = await Promise.all([
      trees?.(),
      datasetCatalog(),
    ]);
    const content = langContent(
      slug,
      resolve(src, datasets),
      (page, lang) =>
        render(src, slug, resolvedTrees, catalog, page, lang) as ReactNode,
    );
    if (!content) notFound();
    return (
      <LangContentSwitch
        key={[section, ...(slug ?? [])].join('/')}
        content={content}
        loadLang={localeLoader()?.bind(null, { section, slug })}
      />
    );
  }

  async function Redirect() {
    const dataset = await defaultDataset(section);
    if (!dataset) notFound();
    return <LangRedirect to={sectionUrl(section, dataset)} />;
  }

  function generateStaticParams() {
    if (source) {
      return source.getSource().then((src) =>
        generateDatasetParams(section, src),
      );
    }
    return generateDatasetLandingParams(section);
  }

  async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
    const { slug } = await params;
    if (slug?.length === 1 && landing) {
      const page = getDatasetLanding(
        section,
        slug,
        'en_us',
        await sectionDatasets(section),
      );
      if (!page) notFound();
      return {
        title: page.title,
        description: page.description,
        alternates: {
          canonical: canonicalUrl(`${sectionUrl(section)}/${slug.join('/')}`),
        },
      };
    }
    const src = await source?.getSource();
    if (src) {
      const { defaultLanguage } = loadLocaleRegistry();
      if (slug?.length === 1 && !landing && !getPage(src, slug, defaultLanguage))
        return {};
      return sectionMetadata(section, src, slug);
    }
    return {};
  }

  return { SectionLayout, Page, Redirect, generateStaticParams, generateMetadata };
}
