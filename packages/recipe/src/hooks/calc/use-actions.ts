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
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type {
  CalcCard,
  CalcKind,
  CalcNode,
  CalculatorState,
  CalcWire,
} from '@terrafirmagreg-team/recipe/types/calc';
import type { CalcFlowData } from '@terrafirmagreg-team/recipe/lib/calc/flow';

let cardSeq = 0;
const newCardId = () =>
  `c${Date.now().toString(36)}${(cardSeq += 1).toString(36)}`;

export function useCalcActions({
  dataset,
  lang,
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
}: {
  dataset: DatasetRef;
  lang: Lang;
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
          `${window.location.origin}${recipeCalcHref(res.dataset ?? dataset, undefined, `s${res.id}`)}`,
        );
        return;
      }
    } catch {
    }
    await navigator.clipboard.writeText(
      `${window.location.origin}${recipeCalcHref(dataset, undefined, tree)}`,
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
      const crafts = recipeId && outputAmount
        ? Math.max(1, Math.ceil(need / outputAmount))
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
    [nodes, cards, wires, flushAmounts, persist, tagSelections],
  );

  const onOpenItem = useCallback(
    (materialId: string, kind: CalcKind) => {
      window.open(
        recipeStackHref(dataset, lang, materialId, { kind }),
        '_blank',
        'noopener',
      );
    },
    [dataset, lang],
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

  const onWire = useCallback(
    (from: string, to: string, input: number, out?: number) => {
      if (from === to) return;
      write({
        wires: [
          ...wires.filter(
            (wire) => !(wire.to === to && wire.input === input),
          ),
          { from, to, input, out: out || undefined },
        ],
      });
    },
    [wires, write],
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
      write({
        wires: [
          ...wires.filter(
            (wire) =>
              !(wire.from === from && wire.to === to && wire.input === input) &&
              !(wire.to === next.to && wire.input === next.input),
          ),
          next,
        ],
      });
    },
    [wires, write],
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

