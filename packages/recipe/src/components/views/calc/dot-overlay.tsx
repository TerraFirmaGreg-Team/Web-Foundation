'use client';

import { memo, useEffect, useRef } from 'react';
import { useStore } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import {
  CALC_NODE_H,
  CALC_NODE_W,
  type AnyCalcFlowNode,
} from '@terrafirmagreg-team/recipe/lib/calc/flow';

const cssVar = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim() || fallback;

export const CalcDotOverlay = memo(function CalcDotOverlay({
  nodes,
  focusId,
}: {
  nodes: AnyCalcFlowNode[];
  focusId: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tx = useStore((s) => s.transform[0]);
  const ty = useStore((s) => s.transform[1]);
  const zoom = useStore((s) => s.transform[2]);
  const w = useStore((s) => s.width);
  const h = useStore((s) => s.height);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !w || !h || !zoom) return;
    const dpr = window.devicePixelRatio || 1;
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const card = cssVar('--color-card', '#17171a');
    const border = cssVar('--color-border', '#3f3f46');
    const primary = cssVar('--color-primary', '#00c8c8');
    const danger = cssVar('--color-red-500', '#ef4444');
    ctx.lineWidth = 1;
    for (const node of nodes) {
      const nw = node.width ?? CALC_NODE_W;
      const nh = node.height ?? CALC_NODE_H;
      const x = (node.position.x - nw / 2) * zoom + tx;
      const y = (node.position.y - nh / 2) * zoom + ty;
      const rw = nw * zoom;
      const rh = nh * zoom;
      if (x + rw < 0 || x > w || y + rh < 0 || y > h) continue;
      const { node: calc } = node.data;
      const stroke =
        node.id === focusId || calc.recipe
          ? primary
          : calc.cycle
            ? danger
            : border;
      ctx.fillStyle = card;
      ctx.fillRect(x, y, rw, rh);
      ctx.strokeStyle = stroke;
      ctx.strokeRect(x + 0.5, y + 0.5, Math.max(rw - 1, 0), Math.max(rh - 1, 0));
    }
  });

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10"
      style={{ width: w, height: h }}
    />
  );
});

