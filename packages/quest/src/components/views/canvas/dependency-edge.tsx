'use client';

import { createChevronEdge } from '@terrafirmagreg-team/ui/components/blocks/canvas/chevron-edge';
import {
  questNodeBorderToward,
  questNodeCenter,
} from '@terrafirmagreg-team/quest/lib/shape';

export const DependencyEdge = createChevronEdge({
  resolveCenter: questNodeCenter,
  resolveBorder: questNodeBorderToward,
});

