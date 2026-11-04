import type { Edge, Node } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import type { ChevronEdgeHighlight } from '@terrafirmagreg-team/ui/types/canvas';

export function applyNodeSelection<N extends Node>(
  nodes: N[],
  selectedId: string | null,
  type?: string,
): N[] {
  let changed = false;
  const next = nodes.map((node) => {
    if (type && node.type !== type) return node;
    const selected = selectedId != null && node.id === selectedId;
    if (node.selected === selected) return node;
    changed = true;
    return { ...node, selected };
  });
  return changed ? next : nodes;
}

export function decorateFlowEdges<E extends Edge>(
  edges: E[],
  hoverId: string | null,
  selectedId: string | null,
): E[] {
  return edges.map((edge) => {
    const outgoing = hoverId != null && edge.source === hoverId;
    const incoming = hoverId != null && edge.target === hoverId;
    const selected =
      selectedId != null &&
      (edge.source === selectedId || edge.target === selectedId);
    const sourceEngaged = outgoing || selectedId === edge.source;
    const targetEngaged = incoming || selectedId === edge.target;
    const flags = edge.data as
      | { hideTarget?: boolean; hideSource?: boolean }
      | undefined;
    const hidden =
      (flags?.hideTarget === true && !targetEngaged) ||
      (flags?.hideSource === true && !sourceEngaged);
    const highlight: ChevronEdgeHighlight =
      outgoing || (selected && edge.source === selectedId)
        ? 'outgoing'
        : incoming || (selected && edge.target === selectedId)
          ? 'incoming'
          : undefined;
    return { ...edge, data: { hidden, highlight } };
  });
}

