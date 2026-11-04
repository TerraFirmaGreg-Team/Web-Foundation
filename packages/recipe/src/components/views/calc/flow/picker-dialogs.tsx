'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { Mountain } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Button } from '@terrafirmagreg-team/ui/components/ui/button';
import { CalcRecipePicker } from '@terrafirmagreg-team/recipe/components/views/calc/recipe-picker';
import { CalcMemberPicker } from '@terrafirmagreg-team/recipe/components/views/calc/member-picker';
import type { CalcFlowData } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type { SupplyRequest } from '@terrafirmagreg-team/recipe/hooks/calc/flow/use-pickers';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';
import type { CalcNode } from '@terrafirmagreg-team/recipe/types/calc';

function SupplyPicker({
  supply,
  session,
  data,
  onClose,
}: {
  supply: SupplyRequest;
  session: RecipeSession;
  data: Omit<
    CalcFlowData,
    'node' | 'mode' | 'onRequestPicker' | 'onRequestMemberPicker' | 'onRequestSupply'
  >;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { node, input } = supply;
  const slot = node.inputs[input];
  if (!slot?.id) return null;
  const materialId = slot.id;
  const recipes = data.getRecipesForItem(materialId, slot.kind);
  const supplyNode: CalcNode = {
    ...node,
    materialId,
    kind: slot.kind,
    recipe: null,
    availableRecipes: recipes,
    tagId: undefined,
    members: undefined,
    inputs: [],
  };
  return (
    <CalcRecipePicker
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      node={supplyNode}
      session={session}
      onSelectRecipe={(_cardId, recipeId) => {
        const row = recipes.find((r) => r.recipeId === recipeId);
        data.onSupplyInput(node.id, input, recipeId, row?.outputAmount);
      }}
      onSelectTagMember={data.onSelectTagMember}
      recipeDefaults={data.recipeDefaults}
      onSetRecipeDefault={data.onSetRecipeDefault}
      actions={
        <Button
          size="xs"
          variant="outline"
          className={supplyNode.availableRecipes.length ? 'shrink-0' : 'ms-auto shrink-0'}
          onClick={() => {
            data.onSupplyInput(node.id, input, null);
            onClose();
          }}
        >
          <Mountain className="size-3.5" />
          {t('Keep as external source', { note: 'recipe.calc.supply.source' })}
        </Button>
      }
    />
  );
}

export function CalcPickers({
  pickerNode,
  memberNode,
  supply,
  session,
  dataset,
  data,
  onClosePicker,
  onCloseMember,
  onCloseSupply,
}: {
  pickerNode: CalcNode | null;
  memberNode: CalcNode | null;
  supply: SupplyRequest | null;
  session: RecipeSession;
  dataset: DatasetRef;
  data: Omit<
    CalcFlowData,
    'node' | 'mode' | 'onRequestPicker' | 'onRequestMemberPicker' | 'onRequestSupply'
  >;
  onClosePicker: () => void;
  onCloseMember: () => void;
  onCloseSupply: () => void;
}) {
  return (
    <>
      {pickerNode ? (
        <CalcRecipePicker
          open
          onOpenChange={(open) => {
            if (!open) onClosePicker();
          }}
          node={pickerNode}
          session={session}
          onSelectRecipe={(_materialId, recipeId) =>
            data.onSelectRecipe(pickerNode.id, recipeId)
          }
          onSelectTagMember={data.onSelectTagMember}
          recipeDefaults={data.recipeDefaults}
          onSetRecipeDefault={data.onSetRecipeDefault}
        />
      ) : null}
      {memberNode?.tagId && memberNode.members ? (
        <CalcMemberPicker
          open
          onOpenChange={(open) => {
            if (!open) onCloseMember();
          }}
          tagId={memberNode.tagId}
          members={memberNode.members}
          selected={memberNode.materialId}
          memberKind={memberNode.kind}
          dataset={dataset}
          lang={session.lang}
          langMap={session.langMap}
          onSelect={data.onSelectTagMember}
        />
      ) : null}
      {supply ? (
        <SupplyPicker
          supply={supply}
          session={session}
          data={data}
          onClose={onCloseSupply}
        />
      ) : null}
    </>
  );
}

