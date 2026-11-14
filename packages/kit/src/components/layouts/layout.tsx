'use client';
import {
  useCallback,
  useMemo,
  useState,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { Layout as UiLayout } from '@terrafirmagreg-team/ui/components/layouts/layout';
import {
  LeftSidebar,
  LeftSidebarActions,
  LeftSidebarLanguage,
  LeftSidebarSearch,
  LeftSidebarSeparator,
} from '@terrafirmagreg-team/ui/components/layouts/left-sidebar';
import { Switcher } from '@terrafirmagreg-team/ui/components/blocks/nav/switcher';
import { MobileHeader } from '@terrafirmagreg-team/kit/components/layouts/mobile-header';
import {
  SiteMenu,
  type SiteMenuItem,
} from '@terrafirmagreg-team/ui/components/blocks/nav/site-menu';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { skeletonTree } from '@terrafirmagreg-team/ui/lib/tree';
import { Globe } from 'lucide-react';
import {
  SiCurseforge,
  SiDiscord,
  SiGithub,
  SiModrinth,
} from '@icons-pack/react-simple-icons';
import { usePathname } from 'next/navigation';
import { ReadabilityMenu } from '@terrafirmagreg-team/ui/components/blocks/readability/menu';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useLocaleRegistry } from '@terrafirmagreg-team/translate/hooks/use-locale-registry';
import { LangLocalesScope } from '@terrafirmagreg-team/translate/provider';
import { localeItems } from '@terrafirmagreg-team/translate/create';
import { siteLinks } from '@terrafirmagreg-team/sites';
import { datasetUrlVersion, isSectionKey } from '@terrafirmagreg-team/sites/location';
import { useCurrentDataset } from '@terrafirmagreg-team/kit/hooks/use-current-dataset';
import { useSectionTree } from '@terrafirmagreg-team/kit/hooks/use-section-tree';
import {
  isDatasetFailed,
  useFailedDatasets,
} from '@terrafirmagreg-team/kit/hooks/use-dump-status';
import { useDatasetAccent } from '@terrafirmagreg-team/kit/hooks/use-dataset-accent';
import { useNavOptions } from '@terrafirmagreg-team/kit/hooks/use-nav-options';
import { pinTreeDataset } from '@terrafirmagreg-team/kit/lib/pin-tree';
import { layoutDeps, sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import { datasetLinks } from '@terrafirmagreg-team/kit/lib/dataset-links';
import type {
  DatasetCatalog,
  SectionKey,
  SectionLayoutOptions,
  SectionTrees,
} from '@terrafirmagreg-team/kit/types';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export type LayoutProps = {
  trees: Partial<Record<SectionKey, SectionTrees>>;
  options: Partial<Record<SectionKey, SectionLayoutOptions>>;
  catalog: DatasetCatalog;

  navTitle?: ComponentType<ComponentProps<'a'>>;
  children?: ReactNode;
};

const NAV_KEYS = new Set(['book', 'cat', 'entry', 'category', 'type']);

const NO_LOCALES: readonly never[] = [];

const LINK_ICONS: Record<string, ReactNode> = {
  github: <SiGithub />,
  curseforge: <SiCurseforge />,
  modrinth: <SiModrinth />,
  discord: <SiDiscord />,
};

export function Layout({
  trees: treesBySection,
  options: optionsBySection,
  catalog,
  navTitle,
  children,
}: LayoutProps) {
  'use no memo';
  const t = useTranslations();
  const { defaultLanguage } = useLocaleRegistry();
  const lang: Lang = useResolvedLang();
  const pathname = usePathname();
  const sectionParam = pathname.split('/').filter(Boolean)[0];
  const section = isSectionKey(sectionParam) ? sectionParam : 'docs';
  const options = optionsBySection[section];
  const trees = treesBySection[section] ?? {};
  const sectionDatasets = catalog[section] ?? [];
  const current = useCurrentDataset(sectionDatasets);
  const baseId = current ? current.id : undefined;
  const pinned = current ? datasetUrlVersion(current) : undefined;
  const meta = sectionDatasets.find((item) => item.id === baseId);
  const failedDatasets = useFailedDatasets();
  const datasetFailed =
    baseId !== undefined &&
    isDatasetFailed(failedDatasets, { id: baseId, version: current?.version });
  useDatasetAccent(meta?.accent);
  const nav = useNavOptions({ section, catalog });
  const deps = layoutDeps();
  deps.trackView?.(pathname);
  const commentsItem =
    (deps.commentsMenuItem?.() as SiteMenuItem | false | null) ?? false;
  const Feature = options?.sidebar?.feature;
  const TreeFeature = options?.treeFeature;
  const RightPanel = options?.rightPanel;
  const shipped = baseId
    ? (trees[lang]?.[baseId] ?? trees[defaultLanguage]?.[baseId])
    : undefined;
  const lazy = useSectionTree(
    section,
    baseId,
    lang,
    baseId !== undefined && trees[lang]?.[baseId] === undefined,
  );
  const scoped = lazy ?? shipped;
  const serverTree = useMemo(
    () =>
      scoped ?? {
        name: section,
        children: [],
        $id: `${section}:empty`,
      },
    [scoped, section],
  );
  const [feature, setFeature] =
    useState<{ input: PageTree.Root; tree: PageTree.Root }>();
  const onFeatureTree = useCallback(
    (next: { input: PageTree.Root; tree: PageTree.Root }) =>
      setFeature((prev) =>
        prev?.input === next.input && prev?.tree === next.tree ? prev : next,
      ),
    [],
  );
  const tree =
    TreeFeature &&
    feature?.input.$id != null &&
    feature.input.$id === serverTree.$id
      ? feature.tree
      : serverTree;
  const effectiveTree =
    datasetFailed && !tree.children.length ? skeletonTree() : tree;
  const pinnedTree = useMemo(
    () =>
      pinned && baseId
        ? pinTreeDataset(effectiveTree, section, baseId, pinned)
        : effectiveTree,
    [effectiveTree, section, baseId, pinned],
  );
  const locales = meta?.languages ? localeItems(meta.languages) : NO_LOCALES;
  const links = datasetLinks(
    baseId ? sectionConfig().datasetConfig[baseId] : undefined,
  );
  const menuItems: (SiteMenuItem | 'separator' | false)[] = [
    commentsItem,
    { label: t('Website', { note: 'ui.website' }), icon: <Globe />, url: siteLinks.website },
    'separator',
    { label: 'Discord', icon: <SiDiscord />, url: siteLinks.discord, external: true },
    { label: 'GitHub', icon: <SiGithub />, url: siteLinks.github, external: true },
    {
      label: 'CurseForge',
      icon: <SiCurseforge />,
      url: siteLinks.curseforge,
      external: true,
    },
    {
      label: 'Modrinth',
      icon: <SiModrinth />,
      url: siteLinks.modrinth,
      external: true,
    },
  ];
  if (!isSectionKey(sectionParam)) return <>{children}</>;

  const layout = (
    <UiLayout
      tree={pinnedTree}
      navTitle={navTitle}
      header={
        <MobileHeader
          sections={nav.section.options}
          current={section}
        />
      }
      defaultOpenLevel={options?.defaultOpenLevel}
      sidebar={
        <LeftSidebar
          navKeys={NAV_KEYS}
          menu={<SiteMenu label={t('Site menu', { note: 'ui.site_menu' })} items={menuItems} />}
          footer={
            <>
              <div
                onPointerEnter={
                  deps.warmLang && current
                    ? () => {
                        for (const locale of locales) {
                          if (locale.locale !== lang)
                            deps.warmLang?.(current, locale.locale);
                        }
                      }
                    : undefined
                }
              >
                <LeftSidebarLanguage />
              </div>
              <LeftSidebarActions settings={ReadabilityMenu}>
                {links?.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                      'text-muted-foreground [&_svg]:size-4',
                    )}
                  >
                    {link.icon ? LINK_ICONS[link.icon] : link.label}
                  </a>
                ))}
              </LeftSidebarActions>
            </>
          }
          controls={
            <>
              <LeftSidebarSearch />
              <Switcher {...nav.section} />
              <Switcher {...nav.dataset} />
              {Feature ? (
                <>
                  <LeftSidebarSeparator />
                  <Feature />
                </>
              ) : null}
            </>
          }
        />
      }
      rightPanel={
        RightPanel && current ? (
          <RightPanel
            dataset={current}
            title={meta?.title}
            versions={meta?.versions}
            lang={lang}
          />
        ) : undefined
      }
    >
      {children}
    </UiLayout>
  );
  return (
    <>
      {TreeFeature ? (
        <TreeFeature
          input={serverTree}
          dataset={current}
          onTree={onFeatureTree}
        />
      ) : null}
      <LangLocalesScope locales={locales}>{layout}</LangLocalesScope>
    </>
  );
}
