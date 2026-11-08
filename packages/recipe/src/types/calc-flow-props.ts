import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { ReactNode, RefObject } from 'react';
import type {
  CalcFarMode,
  CalcFlowData,
  CalcViewMode,
} from '@terrafirmagreg-team/recipe/lib/calc/flow';
import type {
  CalcCard,
  CalcNode,
  CalcWire,
} from '@terrafirmagreg-team/recipe/types/calc';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

export type CalcFlowProps = {
  nodes: CalcNode[];
  wires: CalcWire[];
  flows?: readonly (number | undefined)[];
  cards: CalcCard[];
  dataset: DatasetRef;
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
  mode: CalcViewMode;
  onModeChange: (mode: CalcViewMode) => void;
  farCards: CalcFarMode;
  onFarCardsChange: (mode: CalcFarMode) => void;
  treeReady?: boolean;
  resetGen?: number;
  canvasId?: string;
  actions?: ReactNode;
  empty?: ReactNode;
  focusRef?: RefObject<((materialId: string) => void) | null>;
  focusNodeId?: string | null;
  onFocusedNode?: (id: string) => void;
  onRelayout?: (positions: Map<string, { x: number; y: number }>) => void;
};

