'use client';

import { useDocumentTitle } from '@terrafirmagreg-team/ui/hooks/use-document-title';
import { useRecipeSession } from '@terrafirmagreg-team/recipe/hooks/use-session';
import { recipeConfig } from '@terrafirmagreg-team/recipe/lib/config';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import { ItemPanel } from '@terrafirmagreg-team/recipe/components/views/browser/item-panel';
import { RecipeGlareFilter } from '@terrafirmagreg-team/recipe/components/cards/glare-filter';
import { RightSidebarPortal } from '@terrafirmagreg-team/ui/components/layouts/right-sidebar';
import { TypeView } from '@terrafirmagreg-team/recipe/components/views/browser/type-view';
import { ItemView } from '@terrafirmagreg-team/recipe/components/views/browser/item-view';
import { Calculator } from '@terrafirmagreg-team/recipe/components/views/calc/calculator';
import { ForgeCalculator } from '@terrafirmagreg-team/recipe/components/views/forge';
import { AlloyCalculator } from '@terrafirmagreg-team/recipe/components/views/alloy';
import { RecipeFrame } from '@terrafirmagreg-team/recipe/components/views/browser/frame';
import { RecipeTypeTabs } from '@terrafirmagreg-team/recipe/components/views/browser/type-tabs';
import { ItemRow } from '@terrafirmagreg-team/ui/components/blocks/list/row';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import { EntryProvider } from '@terrafirmagreg-team/game/hooks/use-entry-context';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { RecipePageData } from '@terrafirmagreg-team/recipe/types';

export function RecipeBrowserFallback() {
  return (
    <div className="viewport-shell recipe-viewport not-prose flex w-full flex-col gap-3">
      <div className="flex min-h-0 flex-1 gap-4">
        <main className="flex min-w-0 flex-1 flex-col">
          <Skeleton className="mb-3 h-9 w-full rounded-md" />
          <div className="flex min-h-0 flex-1 flex-col items-center justify-start gap-2 pt-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton
                key={i}
                className="h-24 rounded-md"
                style={{ width: 240 + (i % 3) * 70 }}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export function RecipeBrowser({
  dataset: id,
  datasetTitle,
  lang,
  versions,
}: {
  dataset: string;
  datasetTitle: string;
  lang: Lang;
  versions?: readonly string[];
}) {
  const page: RecipePageData = {
    title: datasetTitle,
    dataset: { id },
    lang,
    versions: versions as string[] | undefined,
  };
  const session = useRecipeSession(page);
  const { dataset, item, fluid, names } = session;
  const focusId = item ?? fluid;

  const focusTitle = focusId
    ? recipeItemName(names, lang, focusId)
    : (session.recipeId ?? '');
  useDocumentTitle(`${focusTitle || page.title} | ${recipeConfig().appName}`);

  const isCalc = session.place?.kind === 'calc';

  let main;
  if (focusId) {
    main = <ItemView session={session} />;
  } else if (isCalc) {
    main = <Calculator session={session} />;
  } else if (session.place?.kind === 'forge') {
    main = <ForgeCalculator session={session} />;
  } else if (session.place?.kind === 'alloy') {
    main = <AlloyCalculator session={session} />;
  } else if (session.place?.kind === 'type') {
    main = <TypeView session={session} />;
  } else {
    main = (
      <RecipeFrame
        session={session}
        strip={<RecipeTypeTabs session={session} ids={[]} />}
        header={<ItemRow layout="header" title={page.title} />}
      >
        <div className="flex min-h-0 flex-1 flex-col items-center justify-start gap-2 pt-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton
              key={i}
              className="h-24 rounded-md"
              style={{ width: 240 + (i % 3) * 70 }}
            />
          ))}
        </div>
      </RecipeFrame>
    );
  }

  return (
    <EntryProvider dataset={dataset} lang={lang} langMap={session.langMap}>
      <RecipeGlareFilter />
      <div
        className={cn(
          'viewport-shell recipe-viewport not-prose flex w-full flex-col gap-3',
          isCalc && 'calc-viewport',
        )}
      >
        <div className="flex min-h-0 flex-1 gap-4">
          <main className="flex min-w-0 flex-1 flex-col">{main}</main>
        </div>
        <RightSidebarPortal>
          <ItemPanel
            dataset={dataset}
            lang={lang}
            index={session.index}
            indexLoading={session.indexLoading}
            names={names}
            tab={session.tab}
            query={session.query}
            setQuery={session.setQuery}
            isCalc={isCalc}
            nav={session.nav}
            className="hidden h-full w-90 lg:flex"
          />
        </RightSidebarPortal>
      </div>
    </EntryProvider>
  );
}

