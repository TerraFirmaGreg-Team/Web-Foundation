'use client';
import {
  useMemo,
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
import {
  SiteMenu,
  type SiteMenuItem,
} from '@terrafirmagreg-team/ui/components/blocks/nav/site-menu';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
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
import { useCurrentDataset } from '@terrafirmagreg-team/kit/hooks/use-current-dataset';
import { useDatasetAccent } from '@terrafirmagreg-team/kit/hooks/use-dataset-accent';
import { useNavOptions } from '@terrafirmagreg-team/kit/hooks/use-nav-options';
import { pinTreeDataset } from '@terrafirmagreg-team/kit/lib/pin-tree';
import { layoutDeps, sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import type {
  DatasetCatalog,
  LeftSidebarSlotProps,
  SectionKey,
  SectionTrees,
} from '@terrafirmagreg-team/kit/types';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

export type LayoutProps = {
  section: SectionKey;
  trees: SectionTrees;
  catalog: DatasetCatalog;

  useTree?: (tree: PageTree.Root) => PageTree.Root;
  sidebar?: Pick<LeftSidebarSlotProps, 'feature'>;
  navTitle?: ComponentType<ComponentProps<'a'>>;
  children?: ReactNode;
};

const NAV_KEYS = new Set(['book', 'cat', 'entry', 'category', 'type']);

const LINK_ICONS: Record<string, ReactNode> = {
  github: <SiGithub />,
  curseforge: <SiCurseforge />,
  modrinth: <SiModrinth />,
  discord: <SiDiscord />,
};

const identityTree = (tree: PageTree.Root) => tree;

export function Layout({
  section,
  trees,
  catalog,
  useTree = identityTree,
  sidebar,
  navTitle,
  children,
}: LayoutProps) {
  const t = useTranslations();
  const { defaultLanguage } = useLocaleRegistry();
  const lang: Lang = useResolvedLang();
  const current = useCurrentDataset(catalog[section]);
  const baseId = current ? current.id : undefined;
  const pinned = current ? current.version : undefined;
  const meta = catalog[section].find((item) => item.id === baseId);
  useDatasetAccent(meta?.accent);
  const nav = useNavOptions({ section, catalog });
  const pathname = usePathname();
  const deps = layoutDeps();
  deps.trackView?.(pathname);
  const commentsItem =
    (deps.commentsMenuItem?.() as SiteMenuItem | false | null) ?? false;
  const Feature = sidebar?.feature;
  const scoped = baseId
    ? (trees[lang]?.[baseId] ?? trees[defaultLanguage]?.[baseId])
    : undefined;
  const serverTree = scoped ?? {
    name: section,
    children: [],
    $id: `${section}:empty`,
  };
  const tree = useTree(serverTree);
  const pinnedTree = useMemo(
    () =>
      pinned && baseId
        ? pinTreeDataset(tree, section, baseId, pinned)
        : tree,
    [tree, section, baseId, pinned],
  );
  const locales = meta?.languages ? localeItems(meta.languages) : undefined;
  const links = baseId
    ? sectionConfig().datasetConfig[baseId]?.links
    : undefined;
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

  const layout = (
    <UiLayout
      tree={pinnedTree}
      navTitle={navTitle}
      sidebar={
        <LeftSidebar
          navKeys={NAV_KEYS}
          menu={<SiteMenu label={t('Site menu', { note: 'ui.site_menu' })} items={menuItems} />}
          footer={
            <>
              <LeftSidebarLanguage />
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
    >
      {children}
    </UiLayout>
  );
  return locales ? (
    <LangLocalesScope locales={locales}>{layout}</LangLocalesScope>
  ) : (
    layout
  );
}
