'use client';

import { useDocumentTitle } from '@terrafirmagreg-team/ui/hooks/use-document-title';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useFailedDatasets } from '@terrafirmagreg-team/kit/hooks/use-dump-status';
import {
  DumpUnavailable,
  DumpUnavailableOverlay,
} from '@terrafirmagreg-team/kit/components/views/unavailable';
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
import {
  RecipeHeaderSkeleton,
  RecipeTabsSkeleton,
} from '@terrafirmagreg-team/recipe/components/views/browser/item-panel/skeleton';
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
          <RecipeTabsSkeleton />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border pb-2 pt-2">
            <RecipeHeaderSkeleton />
          </div>
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
  const t = useTranslations();
  const session = useRecipeSession(page);
  const { dataset, item, fluid, names } = session;
  const focusId = item ?? fluid;
  const failed =
    useFailedDatasets().includes(id) && !session.index?.items.length;

  const focusTitle = focusId
    ? recipeItemName(names, lang, focusId)
    : (session.recipeId ?? '');
  useDocumentTitle(`${focusTitle || page.title} | ${recipeConfig().appName}`);

  const isCalc = session.place?.kind === 'calc';

  const frameSkeleton = (
    <RecipeFrame
      session={session}
      strip={<RecipeTabsSkeleton />}
      header={<RecipeHeaderSkeleton />}
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

  let main;
  if (failed) {
    main = frameSkeleton;
  } else if (focusId) {
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
    main = frameSkeleton;
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
          <main className="relative flex min-w-0 flex-1 flex-col">
            {main}
            {failed ? (
              <DumpUnavailableOverlay>
                <DumpUnavailable>
                  {t(
                    'Recipe data is temporarily unavailable. Try again later.',
                    { note: 'recipe.unavailable' },
                  )}
                </DumpUnavailable>
              </DumpUnavailableOverlay>
            ) : null}
          </main>
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

