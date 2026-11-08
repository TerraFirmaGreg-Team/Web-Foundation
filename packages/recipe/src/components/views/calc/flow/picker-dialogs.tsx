'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { Mountain, SquareArrowOutUpRight } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Button } from '@terrafirmagreg-team/ui/components/ui/button';
import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { CalcRecipePicker } from '@terrafirmagreg-team/recipe/components/views/calc/recipe-picker';
import { CalcMemberPicker } from '@terrafirmagreg-team/recipe/components/views/calc/member-picker';
import { usesForInput } from '@terrafirmagreg-team/recipe/lib/browser/lookup';
import type { CalcFlowData } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type {
  DemandRequest,
  SupplyRequest,
} from '@terrafirmagreg-team/recipe/hooks/calc/flow/use-pickers';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';
import type {
  CalcNode,
  CalcRecipeSummary,
} from '@terrafirmagreg-team/recipe/types/calc';

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
    | 'node'
    | 'mode'
    | 'onRequestPicker'
    | 'onRequestMemberPicker'
    | 'onRequestSupply'
    | 'onRequestDemand'
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

function DemandPicker({
  demand,
  session,
  data,
  onClose,
}: {
  demand: DemandRequest;
  session: RecipeSession;
  data: Omit<
    CalcFlowData,
    | 'node'
    | 'mode'
    | 'onRequestPicker'
    | 'onRequestMemberPicker'
    | 'onRequestSupply'
    | 'onRequestDemand'
  >;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { node, output } = demand;
  const slot = node.outputs[output];
  const materialId = slot?.id ?? '';
  const kind = slot?.kind ?? 'item';
  const uses = useAsyncResult(
    session.index && materialId
      ? () => usesForInput(session.dataset, session.index!, materialId, kind)
      : false,
    [session.dataset, session.index, materialId, kind],
  );
  if (!slot?.id) return null;
  const seen = new Set<string>();
  const recipes: CalcRecipeSummary[] = (uses.value ?? []).flatMap((row) => {
    if (seen.has(row.id)) return [];
    seen.add(row.id);
    return [
      {
        recipeId: row.id,
        category: session.index?.types[row.type] ?? row.cat ?? row.id,
        outputAmount: 1,
        row,
      },
    ];
  });
  const demandNode: CalcNode = {
    ...node,
    materialId,
    kind,
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
      node={demandNode}
      session={session}
      onSelectRecipe={(_cardId, recipeId) => {
        if (recipeId) data.onDemandOutput(node.id, output, recipeId);
        onClose();
      }}
      onSelectTagMember={data.onSelectTagMember}
      recipeDefaults={data.recipeDefaults}
      onSetRecipeDefault={data.onSetRecipeDefault}
      actions={
        <Button
          size="xs"
          variant="outline"
          className="ms-auto shrink-0"
          onClick={() => {
            data.onOpenItem(materialId, kind, 'uses');
            onClose();
          }}
        >
          <SquareArrowOutUpRight className="size-3.5" />
          {t('Open uses page', { note: 'recipe.calc.demand.uses' })}
        </Button>
      }
    />
  );
}

export function CalcPickers({
  pickerNode,
  memberNode,
  supply,
  demand,
  session,
  dataset,
  data,
  onClosePicker,
  onCloseMember,
  onCloseSupply,
  onCloseDemand,
}: {
  pickerNode: CalcNode | null;
  memberNode: CalcNode | null;
  supply: SupplyRequest | null;
  demand: DemandRequest | null;
  session: RecipeSession;
  dataset: DatasetRef;
  data: Omit<
    CalcFlowData,
    | 'node'
    | 'mode'
    | 'onRequestPicker'
    | 'onRequestMemberPicker'
    | 'onRequestSupply'
    | 'onRequestDemand'
  >;
  onClosePicker: () => void;
  onCloseMember: () => void;
  onCloseSupply: () => void;
  onCloseDemand: () => void;
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
      {demand ? (
        <DemandPicker
          demand={demand}
          session={session}
          data={data}
          onClose={onCloseDemand}
        />
      ) : null}
    </>
  );
}

