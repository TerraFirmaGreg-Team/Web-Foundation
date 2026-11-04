'use client';

import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
} from '@terrafirmagreg-team/ui/components/ui/dialog';
import type { CalcFlowData } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';
import { PickerBody } from '@terrafirmagreg-team/recipe/components/views/calc/recipe-picker/body';

export function CalcRecipePicker({
  open,
  onOpenChange,
  node,
  session,
  onSelectRecipe,
  onSelectTagMember,
  recipeDefaults,
  onSetRecipeDefault,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: CalcFlowData['node'];
  session: RecipeSession;
  onSelectRecipe: CalcFlowData['onSelectRecipe'];
  onSelectTagMember: CalcFlowData['onSelectTagMember'];
  recipeDefaults: CalcFlowData['recipeDefaults'];
  onSetRecipeDefault: CalcFlowData['onSetRecipeDefault'];
  actions?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(78dvh,760px)] w-[min(96vw,1160px)] max-w-[98vw] flex-col overflow-hidden bg-background sm:max-w-[1160px] max-sm:h-[88dvh] max-sm:w-[98vw]">
        {open ? (
          <PickerBody
            node={node}
            session={session}
            onSelectRecipe={onSelectRecipe}
            onSelectTagMember={onSelectTagMember}
            recipeDefaults={recipeDefaults}
            onSetRecipeDefault={onSetRecipeDefault}
            actions={actions}
            close={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

