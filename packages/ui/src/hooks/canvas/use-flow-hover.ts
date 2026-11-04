'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { FlowHoverValue } from '@terrafirmagreg-team/ui/types/canvas';

export const FlowHoverContext = createContext<FlowHoverValue>({
  id: null,
  setId: () => {},
});

export function useFlowHover(): FlowHoverValue {
  const [id, setId] = useState<string | null>(null);
  return useMemo(() => ({ id, setId }), [id]);
}

export function useFlowHoverState(): FlowHoverValue {
  return useContext(FlowHoverContext);
}

