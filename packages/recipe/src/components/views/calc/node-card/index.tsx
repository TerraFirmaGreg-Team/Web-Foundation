'use client';

import { memo } from 'react';
import type { NodeProps } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { useCalcFar } from '@terrafirmagreg-team/recipe/hooks/calc/use-far-mode';
import { useCalcTier } from '@terrafirmagreg-team/recipe/hooks/calc/use-tier';
import type { CalcFlowNode } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import { CalcNodeCardFull } from '@terrafirmagreg-team/recipe/components/views/calc/node-card/full';
import {
  CalcDotCard,
  CalcFarCard,
  CalcHiddenCard,
} from '@terrafirmagreg-team/recipe/components/views/calc/node-card/far';

export const CalcNodeCard = memo(function CalcNodeCard(
  props: NodeProps<CalcFlowNode>,
) {

  const farCards = useCalcFar();
  const tier = useCalcTier();
  if (tier === 'near') return <CalcNodeCardFull {...props} />;
  if (farCards === 'hidden') return <CalcHiddenCard {...props} />;
  if (farCards === 'full') return <CalcNodeCardFull {...props} />;
  if (tier === 'dot') return <CalcDotCard {...props} />;
  return <CalcFarCard {...props} />;
});

