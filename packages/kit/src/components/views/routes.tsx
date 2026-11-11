import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type * as PageTree from 'fumadocs-core/page-tree';
import { flattenTree } from 'fumadocs-core/page-tree';
import { LangContentSwitch } from '@terrafirmagreg-team/ui/components/blocks/lang/content';
import { SectionNotFound } from '@terrafirmagreg-team/kit/components/views/not-found';
import {
  renderSectionView,
  renderSectionWorkspace,
  type SectionPageView,
  type SectionPageViewFn,
} from '@terrafirmagreg-team/kit/components/views/section';
import { baseOptions } from '@terrafirmagreg-team/kit/lib/layout';
import {
  datasetCatalog,
  defaultDataset,
  findDataset,
  sectionDatasets,
} from '@terrafirmagreg-team/kit/lib/datasets';
import {
  datasetLandingMetadata,
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
  canonicalUrl,
  getVariantImageUrl,
} from '@terrafirmagreg-team/kit/lib/urls';
import {
  localeLoader,
  registerLocaleRenderer,
} from '@terrafirmagreg-team/kit/lib/locale/renderer';
import { registerSectionTrees } from '@terrafirmagreg-team/kit/lib/section-trees';
import { sectionUrl, type DatasetRef } from '@terrafirmagreg-team/sites/location';
import { resolveLang } from '@terrafirmagreg-team/translate/lib/code';
import { withLang } from '@terrafirmagreg-team/translate/lib/url';
import { langContent, loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import type {
  DatasetCatalog,
  DatasetLanding,
  DeepLinkResolver,
  SectionDataset,
  SectionKey,
  SectionPage,
  SectionSource,
  SectionTrees,
} from '@terrafirmagreg-team/kit/types';
import type { SectionFeatures } from '@terrafirmagreg-team/kit/types/features';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export interface SectionLayoutViewProps {
  section: SectionKey;
  trees: SectionTrees;
  catalog: DatasetCatalog;
  useTree?: (tree: PageTree.Root, dataset?: DatasetRef) => PageTree.Root;
  sidebar?: { feature?: ComponentType };
  navTitle?: ComponentType<ComponentProps<'a'>>;
  children?: ReactNode;
}

export type SectionLandingView = SectionPageView;

export interface SectionLandingProps<TSource = unknown> {
  page: DatasetLanding;
  lang: Lang;
  route: string;
  source: TSource;
  trees?: SectionTrees;
  catalog: DatasetCatalog;
  contentDir: string;
  history?: boolean;
  features?: SectionFeatures;
}

export interface SectionRoutesOptions<
  S extends SectionKey,
  TSource = SectionSource,
> {
  section: S;
  trees?: (lang: Lang) => Promise<SectionTrees>;
  source: {
    getSource: () => TSource | Promise<TSource>;
    contentDir?: string;
    history?: boolean;
  };
  features?: SectionFeatures;
  layout: ComponentType<SectionLayoutViewProps>;
  landing?: (
    props: SectionLandingProps<TSource>,
  ) => SectionLandingView | Promise<SectionLandingView>;
  page?: SectionPageViewFn;
  deepLink?: DeepLinkResolver;
}

interface RouteParams {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type Resolved = { page: unknown; isFallback: boolean } | undefined;

async function redirectToSection(section: SectionKey, request: Request) {
  const dataset = await defaultDataset(section);
  if (!dataset) notFound();
  const { languages, defaultLanguage } = loadLocaleRegistry();
  redirect(
    withLang(
      sectionUrl(section, dataset),
      resolveLang(
        new URL(request.url).searchParams.get('lang'),
        languages,
        defaultLanguage,
      ),
      defaultLanguage,
    ),
  );
}

export function createSectionRedirect(section: SectionKey) {
  return function GET(request: Request) {
    return redirectToSection(section, request);
  };
}

export function createSectionNotFound(section: SectionKey) {
  return async function NotFound() {
    const datasets = await sectionDatasets(section);
    return <SectionNotFound section={section} datasets={datasets} />;
  };
}

export function createSectionRoutes<
  S extends SectionKey,
  TSource = SectionSource,
>({
  section,
  trees,
  source,
  features,
  layout: LayoutView,
  landing,
  page: PageView,
  deepLink,
}: SectionRoutesOptions<S, TSource>) {
  const resolve =
    (src: TSource, datasets: readonly SectionDataset[]) =>
    (slug: string[] | undefined, lang: Lang): Resolved => {
      if (slug?.length === 1) {
        if (!findDataset(datasets, { id: slug[0] })) return undefined;
        if (landing) {
          const page = getDatasetLanding(section, slug, lang, datasets);
          if (!page) return undefined;
          if (!PageView) return { page, isFallback: false };
          const own = (src as SectionSource)
            .getPages()
            .some(
              (p) =>
                p.slugs[0] === slug[0] &&
                ((p as SectionPage).locale ?? p.slugs[1]) === lang,
            );
          return { page, isFallback: !own };
        }
      }
      return PageView ? resolvePage(src as SectionSource, slug, lang) : undefined;
    };

  const render = async (
    src: TSource,
    slug: string[] | undefined,
    resolvedTrees: SectionTrees | undefined,
    catalog: DatasetCatalog,
    page: unknown,
    lang: Lang,
  ): Promise<ReactNode> => {
    if (slug?.length === 1 && landing) {
      const view = await landing({
        page: page as DatasetLanding,
        lang,
        route: sectionUrl(section),
        source: src,
        trees: resolvedTrees,
        catalog,
        contentDir: source.contentDir ?? `content/${section}`,
        history: source.history,
        features,
      });
      return renderSectionView(view);
    }
    if (!PageView) return null;
    return renderSectionWorkspace({
      section,
      source: src as SectionSource,
      slug,
      contentDir: source.contentDir ?? `content/${section}`,
      trees: resolvedTrees,
      catalog,
      history: source.history,
      features,
      workspace: PageView,
      page: page as SectionPage,
      lang,
    });
  };

  if (trees) registerSectionTrees(section, trees);

  registerLocaleRenderer(section, {
    resolve: async (slug, lang) =>
      resolve(await source.getSource(), await sectionDatasets(section))(
        slug,
        lang,
      ),
    render: async (page, slug, lang) =>
      render(
        await source.getSource(),
        slug,
        await trees?.(lang).catch(() => undefined),
        await datasetCatalog().catch((): DatasetCatalog => ({}) as DatasetCatalog),
        page,
        lang,
      ),
  });

  async function SectionLayout({ children }: { children?: ReactNode }) {
    const { slots } = baseOptions();
    const { defaultLanguage } = loadLocaleRegistry();
    const [resolvedTrees, catalog] = await Promise.all([
      trees
        ? trees(defaultLanguage).catch((): SectionTrees => ({}))
        : Promise.resolve<SectionTrees>({}),
      datasetCatalog().catch((): DatasetCatalog => ({}) as DatasetCatalog),
    ]);
    return (
      <LayoutView
        section={section}
        trees={resolvedTrees}
        catalog={catalog}
        navTitle={slots?.navTitle}
      >
        {children}
      </LayoutView>
    );
  }

  async function Page({ params, searchParams }: RouteParams) {
    const { slug } = await params;
    const [src, datasets] = await Promise.all([
      source.getSource(),
      sectionDatasets(section),
    ]);

    if (slug?.length === 1 && !landing && PageView) {
      const { languages, defaultLanguage } = loadLocaleRegistry();
      if (!getPage(src as SectionSource, slug, defaultLanguage)) {
        const resolvedTrees = trees ? await trees(defaultLanguage) : undefined;
        const first = flattenTree(
          resolvedTrees?.[defaultLanguage]?.[slug[0]]?.children ?? [],
        )[0];
        if (first)
          redirect(
            withLang(
              first.url,
              resolveLang(
                (await searchParams)['lang'],
                languages,
                defaultLanguage,
              ),
              defaultLanguage,
            ),
          );
      }
    }

    const catalog = await datasetCatalog().catch(
      (): DatasetCatalog => ({}) as DatasetCatalog,
    );
    const content = langContent(
      slug,
      resolve(src, datasets),
      async (page, lang) =>
        render(
          src,
          slug,
          await trees?.(lang).catch(() => undefined),
          catalog,
          page,
          lang,
        ) as ReactNode,
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

  function Redirect(request: Request) {
    return redirectToSection(section, request);
  }

  function generateStaticParams() {
    if (PageView) {
      return Promise.resolve(source.getSource()).then((src) =>
        generateDatasetParams(section, src as SectionSource),
      );
    }
    return generateDatasetLandingParams(section);
  }

  async function generateMetadata({
    params,
    searchParams,
  }: RouteParams): Promise<Metadata> {
    const { slug } = await params;
    if (slug?.length === 1 && landing) {
      const datasets = await sectionDatasets(section);
      const meta = await datasetLandingMetadata(section, slug, datasets);
      if (deepLink) {
        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(await searchParams)) {
          const first = Array.isArray(value) ? value[0] : value;
          if (first !== undefined) search.set(key, first);
        }
        if ([...search.keys()].length) {
          const { defaultLanguage, languages } = loadLocaleRegistry();
          const langParam = search.get('lang');
          const deep = await deepLink({
            datasetId: slug[0],
            search,
            lang:
              langParam && languages.includes(langParam)
                ? langParam
                : defaultLanguage,
          }).catch(() => undefined);
          const version =
            search.get('version') ??
            datasets.find((d) => d.id === slug[0])?.versions?.[0];
          const imageQuery = [
            deep?.imageQuery,
            version ? `version=${encodeURIComponent(version)}` : '',
          ]
            .filter(Boolean)
            .join('&');
          const og = meta.openGraph as
            | {
                url?: string;
                title?: string;
                description?: string;
                images?: {
                  url: string;
                  width: number;
                  height: number;
                  type: string;
                }[];
              }
            | undefined;
          const base = og?.title as string | undefined;
          const title =
            deep?.title && base
              ? `${deep.title} · ${base}`
              : (deep?.title ?? base);
          const description =
            deep?.description ?? (og?.description as string | undefined);
          const imageUrl = imageQuery
            ? canonicalUrl(
                getVariantImageUrl(section, slug[0], imageQuery).url,
              )
            : undefined;
          if (deep || imageQuery) {
            return {
              ...meta,
              title,
              description,
              openGraph: {
                ...meta.openGraph,
                title,
                description,
                images: imageUrl
                  ? [
                      {
                        url: imageUrl,
                        width: 1200,
                        height: 630,
                        type: 'image/webp',
                      },
                    ]
                  : og?.images,
              },
              twitter: { ...meta.twitter, title, description },
            };
          }
        }
      }
      return meta;
    }
    if (!PageView) return {};
    const src = (await source.getSource()) as SectionSource | undefined;
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
