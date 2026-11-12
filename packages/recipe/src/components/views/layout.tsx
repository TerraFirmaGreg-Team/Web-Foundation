'use client';
import { useEffect, useMemo } from 'react';
import type {
  SectionRightPanelProps,
  TreeFeatureProps,
} from '@terrafirmagreg-team/kit/types';
import { ItemPanel } from '@terrafirmagreg-team/recipe/components/views/browser/item-panel';
import { useRecipeSession } from '@terrafirmagreg-team/recipe/hooks/use-session';
import { useRecipeLeftSidebarTree } from '@terrafirmagreg-team/recipe/hooks/use-left-sidebar-tree';
import { EntryProvider } from '@terrafirmagreg-team/game/hooks/use-entry-context';
import type { RecipePageData } from '@terrafirmagreg-team/recipe/types';

export function RecipeTreeFeature({ input, dataset, onTree }: TreeFeatureProps) {
  const tree = useRecipeLeftSidebarTree(input, dataset);
  useEffect(() => onTree({ input, tree }), [input, tree, onTree]);
  return null;
}

export function RecipePanelFeature({
  dataset,
  title,
  versions,
  lang,
}: SectionRightPanelProps) {
  const page = useMemo<RecipePageData>(
    () => ({
      title: title ?? dataset?.id ?? '',
      dataset: dataset ?? { id: '' },
      lang,
      versions,
    }),
    [dataset, title, lang, versions],
  );
  const session = useRecipeSession(page);
  if (!dataset?.id) return null;
  return (
    <EntryProvider
      dataset={session.dataset}
      lang={lang}
      langMap={session.langMap}
    >
      <ItemPanel
        dataset={session.dataset}
        lang={lang}
        index={session.index}
        indexLoading={session.indexLoading}
        names={session.names}
        tab={session.tab}
        query={session.query}
        setQuery={session.setQuery}
        isCalc={session.place?.kind === 'calc'}
        nav={session.nav}
        className="hidden h-full w-90 lg:flex"
      />
    </EntryProvider>
  );
}
