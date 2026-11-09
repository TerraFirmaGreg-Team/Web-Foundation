'use client';

import { Factory } from 'lucide-react';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import { stackIdFromRef } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

export function WorkstationRail({
  session,
  workstations,
}: {
  session: RecipeSession;
  workstations: TaggedReference[] | undefined;
}) {
  if (!workstations?.length) return null;
  const { lang, names, nav } = session;
  return (
    <div className="flex max-h-full flex-col items-center gap-1 self-start overflow-y-auto overflow-x-hidden rounded-lg border border-border bg-muted/60 p-1">
      <Factory
        className="m-1 size-3.5 shrink-0 text-muted-foreground"
        aria-hidden
      />
      {workstations.map((ref) => {
        const id = stackIdFromRef(ref);
        return (
          <Entry
            key={id}
            reference={ref}
            name={recipeItemName(names, lang, id)}
            variant="chip"
            size="lg"
            className="size-9 shrink-0"
            tab={nav.tab}
            search={nav.search}
          />
        );
      })}
    </div>
  );
}

