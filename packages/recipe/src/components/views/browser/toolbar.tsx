'use client';

import { useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Button } from '@terrafirmagreg-team/ui/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@terrafirmagreg-team/ui/components/ui/sheet';
import { ItemPanel } from '@terrafirmagreg-team/recipe/components/views/browser/item-panel';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

export function RecipeToolbar({ session }: { session: RecipeSession }) {
  const t = useTranslations();
  const [itemsOpen, setItemsOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="lg:hidden"
        onClick={() => setItemsOpen(true)}
      >
        <LayoutGrid className="size-3.5" />
        {t('Items', { note: 'recipe.items' })}
      </Button>
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

