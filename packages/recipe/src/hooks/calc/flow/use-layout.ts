'use client';

import { useCallback, useMemo } from 'react';
import {
  cardsToFlow,
  GRID_GAPS,
  CALC_NODE_H,
  CALC_NODE_W,
  type CalcFlowData,
  type CalcViewMode,
} from '@terrafirmagreg-team/recipe/lib/calc/flow';
import { layoutCards } from '@terrafirmagreg-team/recipe/lib/calc/pack';
import type {
  CalcCard,
  CalcNode,
  CalcWire,
} from '@terrafirmagreg-team/recipe/types/calc';

export function useFlowLayout({
  nodes,
  wires,
  flows,
  cards,
  data,
  mode,
  onRequestPicker,
  onRequestMemberPicker,
  onRequestSupply,
}: {
  nodes: CalcNode[];
  wires: CalcWire[];
  flows?: readonly (number | undefined)[];
  cards: CalcCard[];
  data: Omit<
    CalcFlowData,
    | 'node'
    | 'mode'
    | 'onRequestPicker'
    | 'onRequestMemberPicker'
    | 'onRequestSupply'
    | 'onCrafts'
  >;
  mode: CalcViewMode;
  onRequestPicker: (node: CalcNode) => void;
  onRequestMemberPicker: (node: CalcNode) => void;
  onRequestSupply: (node: CalcNode, input: number) => void;
}) {
  const flowData = useMemo(
    () =>
      ({
        ...data,
        mode,
        onRequestPicker,
        onRequestMemberPicker,
        onRequestSupply,
      }) as Omit<CalcFlowData, 'node'>,
    [
      data,
      mode,
      onRequestPicker,
      onRequestMemberPicker,
      onRequestSupply,
    ],
  );
  const rawFlow = useMemo(
    () => cardsToFlow(nodes, wires, flowData, flows),
    [nodes, wires, flowData, flows],
  );

  const storedPos = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const card of cards) {
      if (card.pos) map.set(card.id, card.pos);
    }
    return map;
  }, [cards]);

  const positioned = useMemo(() => {
    const flowNodes = rawFlow.nodes.map((node, index) => {
      const stored = storedPos.get(node.id);
      const position = stored ?? {
        x: 40 + (index % 4) * (CALC_NODE_W + GRID_GAPS.x + 20),
        y: 40 + Math.floor(index / 4) * (CALC_NODE_H + GRID_GAPS.y + 40),
      };
      return { ...node, position };
    });
    const present = new Set(flowNodes.map((node) => node.id));
    const edges = rawFlow.edges.filter(
      (edge) => present.has(edge.source) && present.has(edge.target),
    );
    return { nodes: flowNodes, edges };
  }, [rawFlow, storedPos]);

  const relayout = useCallback(
    () => layoutCards(nodes, wires, {
      mode,
      gaps: GRID_GAPS,
      recipeBody: data.recipeBody,
    }),
    [nodes, wires, mode, data.recipeBody],
  );

  return { rawFlow, positioned, relayout };
}

