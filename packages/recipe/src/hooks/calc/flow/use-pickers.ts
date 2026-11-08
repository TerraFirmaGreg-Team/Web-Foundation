'use client';

import { useCallback, useState } from 'react';
import type { CalcNode } from '@terrafirmagreg-team/recipe/types/calc';

export type SupplyRequest = { node: CalcNode; input: number };
export type DemandRequest = { node: CalcNode; output: number };

export function useFlowPickers(nodes: CalcNode[]) {
  const [pickerNode, setPickerNode] = useState<CalcNode | null>(null);
  const [memberNode, setMemberNode] = useState<CalcNode | null>(null);
  const [supply, setSupply] = useState<SupplyRequest | null>(null);
  const [demand, setDemand] = useState<DemandRequest | null>(null);
  const onRequestPicker = useCallback(
    (node: CalcNode) => setPickerNode(node),
    [],
  );
  const onRequestMemberPicker = useCallback(
    (node: CalcNode) => setMemberNode(node),
    [],
  );
  const onRequestSupply = useCallback(
    (node: CalcNode, input: number) => setSupply({ node, input }),
    [],
  );
  const onRequestDemand = useCallback(
    (node: CalcNode, output: number) => setDemand({ node, output }),
    [],
  );

  const [prevNodes, setPrevNodes] = useState(nodes);
  if (prevNodes !== nodes) {
    setPrevNodes(nodes);
    for (const [node, set] of [
      [pickerNode, setPickerNode],
      [memberNode, setMemberNode],
    ] as const) {
      if (!node) continue;
      const live = nodes.find((n) => n.id === node.id);
      if (live && live !== node) set(live);
      else if (!live) set(null);
    }
    if (supply) {
      const live = nodes.find((n) => n.id === supply.node.id);
      if (!live) setSupply(null);
      else if (live !== supply.node)
        setSupply({ node: live, input: supply.input });
    }
    if (demand) {
      const live = nodes.find((n) => n.id === demand.node.id);
      if (!live) setDemand(null);
      else if (live !== demand.node)
        setDemand({ node: live, output: demand.output });
    }
  }

  return {
    pickerNode,
    setPickerNode,
    memberNode,
    setMemberNode,
    supply,
    setSupply,
    demand,
    setDemand,
    onRequestPicker,
    onRequestMemberPicker,
    onRequestSupply,
    onRequestDemand,
  };
}

