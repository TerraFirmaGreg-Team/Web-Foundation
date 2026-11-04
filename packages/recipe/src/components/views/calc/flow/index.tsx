'use client';

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ReactFlowProvider,
  useReactFlow,
  useStore,
  type Edge,
} from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { FlowCanvas } from '@terrafirmagreg-team/ui/components/blocks/canvas/flow-canvas';
import {
  CALC_LOD_DOT,
  CALC_LOD_FAR,
  type AnyCalcFlowNode,
} from '@terrafirmagreg-team/recipe/lib/calc/flow';
import { CalcNodeCard } from '@terrafirmagreg-team/recipe/components/views/calc/node-card';
import { CalcDotOverlay } from '@terrafirmagreg-team/recipe/components/views/calc/dot-overlay';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import { CalcEdge } from '@terrafirmagreg-team/recipe/components/views/calc/edge';
import { CalcSessionProvider } from '@terrafirmagreg-team/recipe/hooks/calc/use-session';
import { CalcFarProvider } from '@terrafirmagreg-team/recipe/hooks/calc/use-far-mode';
import { CalcTierProvider } from '@terrafirmagreg-team/recipe/hooks/calc/use-tier';
import { useFlowPickers } from '@terrafirmagreg-team/recipe/hooks/calc/flow/use-pickers';
import { useFlowLayout } from '@terrafirmagreg-team/recipe/hooks/calc/flow/use-layout';
import { useFlowNodes } from '@terrafirmagreg-team/recipe/hooks/calc/flow/use-nodes';
import { useFlowViewport } from '@terrafirmagreg-team/recipe/hooks/calc/flow/use-viewport';
import { CalcToolbar } from '@terrafirmagreg-team/recipe/components/views/calc/flow/toolbar';
import { CalcPickers } from '@terrafirmagreg-team/recipe/components/views/calc/flow/picker-dialogs';
import { useFlowHandlers } from '@terrafirmagreg-team/recipe/hooks/calc/flow/use-handlers';
import type { CalcFlowProps } from '@terrafirmagreg-team/recipe/types/calc-flow-props';

const nodeTypes = { calcMaterial: CalcNodeCard };
const edgeTypes = { calcEdge: CalcEdge };
const EMPTY_FLOW: AnyCalcFlowNode[] = [];
const EMPTY_EDGES: Edge[] = [];

function useShiftHeld() {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setHeld(false);
    };
    const blur = () => setHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);
  return held;
}

function CalcFlowInner({
  nodes: schemeNodes,
  wires,
  flows,
  cards,
  dataset,
  session,
  data,
  mode,
  onModeChange,
  farCards,
  onFarCardsChange,
  treeReady = true,
  resetGen = 0,
  canvasId,
  actions,
  empty,
  focusRef,
  focusNodeId,
  onFocusedNode,
  onRelayout,
}: CalcFlowProps) {
  const t = useTranslations();
  const { zoomIn, zoomOut } = useReactFlow();
  const shiftHeld = useShiftHeld();
  const {
    pickerNode,
    setPickerNode,
    memberNode,
    setMemberNode,
    supply,
    setSupply,
    onRequestPicker,
    onRequestMemberPicker,
    onRequestSupply,
  } = useFlowPickers(schemeNodes);

  const flowData = useMemo(
    () => ({ ...data, onRequestSupply }),
    [data, onRequestSupply],
  );

  const tier = useStore((s) =>
    s.transform[2] < CALC_LOD_DOT
      ? ('dot' as const)
      : s.transform[2] < CALC_LOD_FAR
        ? ('far' as const)
        : ('near' as const),
  );
  const { rawFlow, positioned, relayout } = useFlowLayout({
    nodes: schemeNodes,
    wires,
    flows,
    cards,
    data,
    mode,
    onRequestPicker,
    onRequestMemberPicker,
    onRequestSupply,
  });
  const focusIdRef = useRef<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const applyFocus = useCallback((id: string | null) => {
    if (focusIdRef.current === id) return;
    focusIdRef.current = id;
    setFocusId(id);
  }, []);
  const focusSeqRef = useRef<{ id: string; index: number } | null>(null);
  const {
    nodes,
    edges,
    mergedFlow,
    extraRects,
    onNodesChange,
    onEdgesChange,
    applyEngaged,
    resetNodes,
  } = useFlowNodes({
    positioned,
    shift: null,
    data: flowData,
    focusId,
    focusIdRef,
    rawFlow,
    mode,
    canvasId,
  });
  const {
    ready,
    centerOnNode,
    handleMoveStart,
    viewportConfig,
    shellProps,
  } = useFlowViewport({
    mergedNodes: mergedFlow.nodes,
    dataset,
    resetGen,
    treeReady,
    mode,
    applyFocus,
    focusSeqRef,
    focusRef,
    focusNodeId,
    onFocusedNode,
    focusId,
  });

  const [prevCanvasId, setPrevCanvasId] = useState(canvasId);
  if (prevCanvasId !== canvasId) {
    setPrevCanvasId(canvasId);
    resetNodes();
    setPickerNode(null);
    setMemberNode(null);
    setSupply(null);
  }

  const {
    handleNodeEnter,
    handleNodeLeave,
    handleNodeClick,
    handleNodeDoubleClick,
    handlePaneClick,
    handleDragOver,
    handleDrop,
    handleConnect,
    handleReconnect,
    handleEdgesDelete,
    handleEdgeClick,
    fitRecipeNodes,
  } = useFlowHandlers({
    data: flowData,
    applyFocus,
    applyEngaged,
    centerOnNode,
    setPickerNode,
  });
  const closePicker = useCallback(() => setPickerNode(null), [setPickerNode]);
  const closeMember = useCallback(() => setMemberNode(null), [setMemberNode]);
  const closeSupply = useCallback(() => setSupply(null), [setSupply]);
  const runRelayout = useCallback(() => {
    onRelayout?.(relayout());
  }, [onRelayout, relayout]);

  return (
    <CalcSessionProvider value={session}>
      <CalcFarProvider value={farCards}>
      <CalcTierProvider value={tier}>
      <FlowCanvas<AnyCalcFlowNode>
        shellProps={shellProps}
        className={cn(
          'calc-flow h-full min-h-0 flex-1',
          tier === 'dot' && 'calc-flow--dots',
          shiftHeld && 'calc-flow--shift',
        )}

        nodes={tier === 'dot' ? EMPTY_FLOW : nodes}
        edges={tier === 'dot' ? EMPTY_EDGES : edges}
        extraRects={extraRects}
        fitNodes={fitRecipeNodes}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeMouseEnter={handleNodeEnter}
        onNodeMouseLeave={handleNodeLeave}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={handlePaneClick}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onMoveStart={handleMoveStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onConnect={handleConnect}
        onReconnect={handleReconnect}
        edgesReconnectable={tier === 'near'}
        onEdgeClick={handleEdgeClick}
        onEdgesDelete={handleEdgesDelete}
        deleteKeyCode={['Backspace', 'Delete']}
        nodesDraggable={tier !== 'dot'}
        nodesConnectable={tier === 'near'}
        selectionKeyCode="Shift"
        multiSelectionKeyCode={['Meta', 'Control']}
        onlyRenderVisibleElements
        minZoom={0.02}
        viewportConfig={viewportConfig}
      >
        {({ onFit }) => (
        <>
        {tier === 'dot' ? (
          <CalcDotOverlay nodes={mergedFlow.nodes} focusId={focusId} />
        ) : null}
        <CalcToolbar
          onFit={onFit}
          onRelayout={runRelayout}
          onZoomIn={() => void zoomIn({ duration: 150 })}
          onZoomOut={() => void zoomOut({ duration: 150 })}
          actions={actions}
          mode={mode}
          onModeChange={onModeChange}
          farCards={farCards}
          onFarCardsChange={onFarCardsChange}
        />
        {schemeNodes.length ? (
          ready ? null : (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center">
              <EmptyState variant="loading">{t('Loading recipe…', { note: 'recipe.loading' })}</EmptyState>
            </div>
          )
        ) : (
          empty
        )}
        </>
        )}
      </FlowCanvas>
      <CalcPickers
        pickerNode={pickerNode}
        memberNode={memberNode}
        supply={supply}
        session={session}
        dataset={dataset}
        data={data}
        onClosePicker={closePicker}
        onCloseMember={closeMember}
        onCloseSupply={closeSupply}
      />
      </CalcTierProvider>
      </CalcFarProvider>
    </CalcSessionProvider>
  );
}

export const CalcFlow = memo(function CalcFlow(props: CalcFlowProps) {
  return (
    <ReactFlowProvider>
      <CalcFlowInner {...props} />
    </ReactFlowProvider>
  );
});

