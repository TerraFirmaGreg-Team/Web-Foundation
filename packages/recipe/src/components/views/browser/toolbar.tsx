'use client';

import { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@terrafirmagreg-team/ui/components/ui/sheet';
import { ItemPanel } from '@terrafirmagreg-team/recipe/components/views/browser/item-panel';
import {
  isDatasetFailed,
  useFailedDatasets,
} from '@terrafirmagreg-team/kit/hooks/use-dump-status';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

export function RecipeToolbar({ session }: { session: RecipeSession }) {
  const t = useTranslations();
  const [itemsOpen, setItemsOpen] = useState(false);
  const failed = isDatasetFailed(useFailedDatasets(), session.dataset);
  if ((session.indexLoading || failed) && !session.index?.items.length)
    return null;

  return (
    <div className="flex items-center gap-2">
      <IconButton
        variant="secondary"
        size="icon-lg"
        className="lg:hidden"
        label={t('Items', { note: 'recipe.items' })}
        onClick={() => setItemsOpen(true)}
      >
        <LayoutGrid className="size-[58%]" />
      </IconButton>
      <Sheet open={itemsOpen} onOpenChange={setItemsOpen}>
        <SheetContent side="right" className="w-full gap-3 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t('Items', { note: 'recipe.items' })}</SheetTitle>
          </SheetHeader>
          <ItemPanel
            dataset={session.dataset}
            lang={session.lang}
            index={session.index}
            indexLoading={session.indexLoading}
            names={session.names}
            tab={session.tab}
            query={session.query}
            setQuery={session.setQuery}
            isCalc={session.place?.kind === 'calc'}
            nav={session.nav}
            className="min-h-0 w-full flex-1 px-4 pb-4"
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

