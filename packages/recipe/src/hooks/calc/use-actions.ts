'use client';

import {
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useCopyButton } from '@terrafirmagreg-team/ui/hooks/use-copy-button';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { recipeCalcHref, recipeStackHref } from '@terrafirmagreg-team/recipe/lib/links';
import type { Recipe } from '@terrafirmagreg-team/recipe/lib/data/dto';
import { loadClientRecipe } from '@terrafirmagreg-team/recipe/lib/client/recipe';
import { resolveClientTag } from '@terrafirmagreg-team/dump/lib/dump/client/tags';
import {
  recipeDivisor,
  toCalcRecipe,
} from '@terrafirmagreg-team/recipe/lib/calc/tree';
import { CALC_NODE_W } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type {
  CalcCard,
  CalcKind,
  CalcNode,
  CalculatorState,
  CalcWire,
  TagResolution,
} from '@terrafirmagreg-team/recipe/types/calc';
import type { RecipeRelation } from '@terrafirmagreg-team/recipe/types';
import type { CalcFlowData } from '@terrafirmagreg-team/recipe/lib/calc/flow';

let cardSeq = 0;
const newCardId = () =>
  `c${Date.now().toString(36)}${(cardSeq += 1).toString(36)}`;

export function useCalcActions({
  dataset,
  lang,
  linkVersion,
  cards,
  wires,
  tagSelections,
  persist,
  recipeDefaults,
  setRecipeDefault,
  recipeBody,
  encodeShare,
  flushAmounts,
  setFocusNodeId,
  nodes,
  tagMembers,
  ensureMaterial,
}: {
  dataset: DatasetRef;
  lang: Lang;
  linkVersion?: string;
  cards: CalcCard[];
  wires: CalcWire[];
  tagSelections: Record<string, string>;
  persist: (next: CalculatorState) => void;
  recipeDefaults: Record<string, string>;
  setRecipeDefault: (materialId: string, recipeId: string | null) => void;
  recipeBody: (recipeId: string) => Recipe | undefined;
  encodeShare: () => string;
  flushAmounts: () => CalcCard[];
  setFocusNodeId: Dispatch<SetStateAction<string | null>>;
  nodes: CalcNode[];
  tagMembers?: (tagId: string) => TagResolution | undefined;
  ensureMaterial?: (materialId: string) => void;
}) {
  const { checked: shared, onClick: onShare } = useCopyButton(async () => {
    const tree = encodeShare();
    const { id: datasetId, version } = dataset;
    try {
      const res = (await fetch(
        `/api/share/recipe/${encodeURIComponent(datasetId)}${version ? `?version=${encodeURIComponent(version)}` : ''}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ tree }),
        },
      ).then((r) => (r.ok ? r.json() : null))) as {
        id?: string;
        dataset?: DatasetRef;
      } | null;
      if (res?.id) {
        await navigator.clipboard.writeText(
          `${window.location.origin}${recipeCalcHref(res.dataset ?? dataset, undefined, `s${res.id}`, linkVersion)}`,
        );
        return;
      }
    } catch {
    }
    await navigator.clipboard.writeText(
      `${window.location.origin}${recipeCalcHref(dataset, undefined, tree, linkVersion)}`,
    );
  });

  const write = useCallback(
    (next: Partial<Pick<CalculatorState, 'cards' | 'wires' | 'tagSelections'>>) => {
      persist({
        cards: next.cards ?? flushAmounts(),
        wires: next.wires ?? wires,
        tagSelections: next.tagSelections ?? tagSelections,
      });
    },
    [flushAmounts, persist, wires, tagSelections],
  );

  const onSelectRecipe = useCallback(
    (cardId: string, recipeId: string | null) => {
      if (!cards.some((row) => row.id === cardId)) return;
      const nextCards = cards.map((row) =>
        row.id === cardId ? { ...row, recipeId } : row,
      );
      const nextWires = recipeId
        ? wires
        : wires.filter((wire) => wire.to !== cardId);
      write({ cards: nextCards, wires: nextWires });
    },
    [cards, wires, write],
  );

  const onSelectTagMember = useCallback(
    (tagId: string, memberId: string) => {
      write({ tagSelections: { ...tagSelections, [tagId]: memberId } });
    },
    [tagSelections, write],
  );

  const onAddCard = useCallback(
    (materialId: string, kind: CalcKind, pos?: { x: number; y: number }) => {
      const id = newCardId();
      persist({
        cards: [
          ...flushAmounts(),
          { id, materialId, kind, recipeId: null, crafts: 1, pos },
        ],
        wires,
        tagSelections,
      });
      setFocusNodeId(id);
      return id;
    },
    [flushAmounts, persist, wires, tagSelections, setFocusNodeId],
  );

  const onSupplyInput = useCallback(
    (cardId: string, inputIndex: number, recipeId: string | null, outputAmount?: number) => {
      const consumerNode = nodes.find((n) => n.id === cardId);
      const consumerCard = cards.find((row) => row.id === cardId);
      const input = consumerNode?.inputs[inputIndex];
      if (!consumerNode || !consumerCard || !input?.id) return null;
      const need = Math.max(1, input.amount - input.covered);
      const per = outputAmount ?? (() => {
        const body = recipeId ? recipeBody(recipeId) : undefined;
        const calc = body ? toCalcRecipe(body) : undefined;
        return calc ? recipeDivisor(calc, input.id!, input.kind) : 0;
      })();
      const crafts = recipeId && per > 0
        ? Math.max(1, Math.ceil(need / per))
        : need;
      const base = consumerCard.pos;
      const id = newCardId();
      const nextWires = [
        ...wires.filter(
          (wire) => !(wire.to === cardId && wire.input === inputIndex),
        ),
        { from: id, to: cardId, input: inputIndex },
      ];
      persist({
        cards: [
          ...flushAmounts(),
          {
            id,
            materialId: input.id,
            kind: input.kind,
            recipeId,
            crafts,
            pos: base
              ? { x: base.x - 40, y: base.y + 140 + inputIndex * 24 }
              : undefined,
          },
        ],
        wires: nextWires,
        tagSelections,
      });
      return id;
    },
    [nodes, cards, wires, flushAmounts, persist, tagSelections, recipeBody],
  );

  const onDemandOutput = useCallback(
    (cardId: string, outputIndex: number, recipeId: string) => {
      const srcNode = nodes.find((n) => n.id === cardId);
      const srcCard = cards.find((row) => row.id === cardId);
      const out = srcNode?.outputs[outputIndex];
      if (!srcNode || !srcCard || !out) return;
      const need =
        out.remaining > 0 ? out.remaining : Math.max(1, out.amount);
      const base = srcCard.pos;
      void (async () => {
        const body = await loadClientRecipe(dataset, recipeId).catch(
          () => undefined,
        );
        const calc = body ? toCalcRecipe(body) : undefined;
        const inputs = calc?.inputs ?? [];
        let inputIndex = inputs.findIndex(
          (slot) =>
            !slot.catalyst && slot.id === out.id && slot.kind === out.kind,
        );
        let pickedTag: string | undefined;
        if (inputIndex < 0) {
          for (let i = 0; i < inputs.length; i += 1) {
            const slot = inputs[i];
            if (!slot?.tagId || slot.catalyst) continue;
            const members =
              tagMembers?.(slot.tagId)?.members ??
              (
                await resolveClientTag(dataset, slot.tagId).catch(
                  () => undefined,
                )
              )?.members ??
              [];
            if (members.includes(out.id)) {
              inputIndex = i;
              pickedTag = slot.tagId;
              break;
            }
          }
        }
        const product = calc?.outputs[0];
        const materialId = product?.id ?? out.id;
        const kind = product?.kind ?? out.kind;
        const inputAmount =
          inputIndex >= 0 ? (inputs[inputIndex]?.amount ?? 1) : 1;
        const crafts = Math.max(1, Math.ceil(need / inputAmount));
        const id = newCardId();
        const card: CalcCard = {
          id,
          materialId,
          kind,
          recipeId,
          crafts,
          pos: base
            ? {
                x: base.x + CALC_NODE_W + 90,
                y: base.y + 40 + outputIndex * 24,
              }
            : undefined,
        };
        persist({
          cards: [...flushAmounts(), card],
          wires:
            inputIndex >= 0
              ? [
                  ...wires,
                  {
                    from: cardId,
                    to: id,
                    input: inputIndex,
                    out: outputIndex,
                  },
                ]
              : wires,
          tagSelections: pickedTag
            ? { ...tagSelections, [pickedTag]: out.id }
            : tagSelections,
        });
        ensureMaterial?.(materialId);
        setFocusNodeId(id);
      })();
    },
    [
      nodes,
      cards,
      wires,
      flushAmounts,
      persist,
      tagSelections,
      dataset,
      tagMembers,
      ensureMaterial,
      setFocusNodeId,
    ],
  );

  const onOpenItem = useCallback(
    (materialId: string, kind: CalcKind, relation?: RecipeRelation) => {
      window.open(
        recipeStackHref(dataset, lang, materialId, { kind, relation, version: linkVersion }),
        '_blank',
        'noopener',
      );
    },
    [dataset, lang, linkVersion],
  );

  const onRemoveCard = useCallback(
    (cardId: string) => {
      write({
        cards: flushAmounts().filter((row) => row.id !== cardId),
        wires: wires.filter(
          (wire) => wire.from !== cardId && wire.to !== cardId,
        ),
      });
    },
    [flushAmounts, write, wires],
  );

  const onMoveCard = useCallback(
    (cardId: string, pos: { x: number; y: number }) => {
      write({
        cards: flushAmounts().map((row) =>
          row.id === cardId ? { ...row, pos } : row,
        ),
      });
    },
    [flushAmounts, write],
  );

  const onMoveCards = useCallback(
    (positions: Map<string, { x: number; y: number }>) => {
      write({
        cards: flushAmounts().map((row) => {
          const pos = positions.get(row.id);
          return pos ? { ...row, pos } : row;
        }),
      });
    },
    [flushAmounts, write],
  );

  const tagPinFor = useCallback(
    (
      to: string,
      input: number,
      from: string,
      out?: number,
    ): string | undefined => {
      const slot = nodes.find((n) => n.id === to)?.inputs[input];
      const srcOut = nodes.find((n) => n.id === from)?.outputs[out ?? 0];
      if (!slot?.tagId || !srcOut?.id) return undefined;
      const member = slot.members?.includes(srcOut.id);
      return member ?? slot.id === srcOut.id ? slot.tagId : undefined;
    },
    [nodes],
  );

  const onWire = useCallback(
    (from: string, to: string, input: number, out?: number) => {
      if (from === to) return;
      const pinTag = tagPinFor(to, input, from, out);
      const srcOut = nodes
        .find((n) => n.id === from)
        ?.outputs[out ?? 0];
      write({
        wires: [
          ...wires.filter(
            (wire) => !(wire.to === to && wire.input === input),
          ),
          { from, to, input, out: out || undefined },
        ],
        tagSelections:
          pinTag && srcOut?.id
            ? { ...tagSelections, [pinTag]: srcOut.id }
            : tagSelections,
      });
    },
    [wires, write, nodes, tagSelections, tagPinFor],
  );

  const onUnwire = useCallback(
    (from: string, to: string, input: number, out?: number) => {
      write({
        wires: wires.filter(
          (wire) =>
            !(
              wire.from === from &&
              wire.to === to &&
              wire.input === input &&
              (wire.out ?? 0) === (out ?? 0)
            ),
        ),
      });
    },
    [wires, write],
  );

  const onRewire = useCallback(
    (
      from: string,
      to: string,
      input: number,
      next: { from: string; to: string; input: number; out?: number },
    ) => {
      if (next.from === next.to) return;
      const pinTag = tagPinFor(next.to, next.input, next.from, next.out);
      const srcOut = nodes
        .find((n) => n.id === next.from)
        ?.outputs[next.out ?? 0];
      write({
        wires: [
          ...wires.filter(
            (wire) =>
              !(wire.from === from && wire.to === to && wire.input === input) &&
              !(wire.to === next.to && wire.input === next.input),
          ),
          next,
        ],
        tagSelections:
          pinTag && srcOut?.id
            ? { ...tagSelections, [pinTag]: srcOut.id }
            : tagSelections,
      });
    },
    [wires, write, nodes, tagSelections, tagPinFor],
  );

  const onWireAmount = useCallback(
    (from: string, to: string, input: number, amount: number | null) => {
      write({
        wires: wires.map((wire) =>
          wire.from === from && wire.to === to && wire.input === input
            ? { ...wire, amount: amount ?? undefined }
            : wire,
        ),
      });
    },
    [wires, write],
  );

  const onClear = useCallback(() => {
    persist({
      cards: [],
      wires: [],
      tagSelections: {},
    });
  }, [persist]);

  const flowData = useMemo<
    Omit<
      CalcFlowData,
      | 'node'
      | 'mode'
      | 'direction'
      | 'onRequestPicker'
      | 'onRequestMemberPicker'
      | 'onRequestSupply'
      | 'onRequestDemand'
      | 'onCrafts'
      | 'getRecipesForItem'
      | 'ensureMaterial'
    >
  >(
    () => ({
      dataset,
      recipeBody,
      onSelectRecipe,
      onSelectTagMember,
      onSupplyInput,
      onDemandOutput,
      onAddCard,
      onOpenItem,
      onRemoveCard,
      onMoveCard,
      onWire,
      onUnwire,
      onRewire,
      onWireAmount,
      recipeDefaults,
      onSetRecipeDefault: setRecipeDefault,
    }),
    [
      dataset,
      recipeBody,
      onSelectRecipe,
      onSelectTagMember,
      onSupplyInput,
      onDemandOutput,
      onAddCard,
      onOpenItem,
      onRemoveCard,
      onMoveCard,
      onWire,
      onUnwire,
      onRewire,
      onWireAmount,
      recipeDefaults,
      setRecipeDefault,
    ],
  );

  return {
    shared,
    onShare,
    flowData,
    onAddCard,
    onRemoveCard,
    onMoveCards,
    onSupplyInput,
    onClear,
  };
}

