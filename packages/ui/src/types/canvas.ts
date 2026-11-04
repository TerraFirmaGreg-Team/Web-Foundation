export type FlowPoint = { x: number; y: number };

export type FlowRect = { x: number; y: number; width: number; height: number };

export type FlowContentBox = {
  midX: number;
  midY: number;
  width: number;
  height: number;
};

export type FlowSizedNode = {
  position: FlowPoint;
  width?: number | null;
  height?: number | null;
};

export type StoredViewport = { x: number; y: number; zoom: number };

export type ChevronEdgeHighlight =
  | 'incoming'
  | 'outgoing'
  | 'dim'
  | undefined;

export type FlowHoverValue = {
  id: string | null;
  setId: (id: string | null) => void;
};

export type FlowCanvasViewport = {
  storageKey: string;
  resetKey: string;
  selectedId?: string | null;

  initFocusId?: string | null;
  suppressPanRef?: { current: string | null };

  userMovedRef?: { current: boolean };
  focusZoom?: number;

  minZoom?: number;
  maxZoom?: number;
  restoreViewport?: boolean;
  ready?: boolean;

  persist?: boolean;
};

export type FlowToolbarProps = {
  onFit?: () => void;
  search?: { label: string; onOpen: () => void };
};

