'use client';

import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ReactFlowProvider,
  useReactFlow,
  useStore,
  type Edge,
} from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@terrafirmagreg-team/ui/components/ui/context-menu';
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
import { CalcSessionProvider } from '@terrafirmagreg-team/recipe/hooks/calc/use-calc-session';
import { CalcPipeEditProvider } from '@terrafirmagreg-team/recipe/hooks/calc/use-pipe-edit';
import { CalcMaterialPicker } from '@terrafirmagreg-team/recipe/components/views/calc/material-picker';
import { FlaskConical, Target } from 'lucide-react';
import { CalcFarProvider } from '@terrafirmagreg-team/recipe/hooks/calc/use-far-mode';
import { CalcRecipeIdsProvider } from '@terrafirmagreg-team/recipe/hooks/calc/use-recipe-ids';
import { CalcTierProvider } from '@terrafirmagreg-team/recipe/hooks/calc/use-tier';
import { useFlowPickers } from '@terrafirmagreg-team/recipe/hooks/calc/flow/use-pickers';
import { useFlowLayout } from '@terrafirmagreg-team/recipe/hooks/calc/flow/use-layout';
import { useFlowNodes } from '@terrafirmagreg-team/recipe/hooks/calc/flow/use-nodes';
import { useFlowViewport } from '@terrafirmagreg-team/recipe/hooks/calc/flow/use-viewport';
import { CalcNotes } from '@terrafirmagreg-team/recipe/components/views/calc/flow/notes';
import { CalcToolbar } from '@terrafirmagreg-team/recipe/components/views/calc/flow/toolbar';
import { CalcPickers } from '@terrafirmagreg-team/recipe/components/views/calc/flow/picker-dialogs';
import { useFlowHandlers } from '@terrafirmagreg-team/recipe/hooks/calc/flow/use-handlers';
import { useShiftHeld } from '@terrafirmagreg-team/recipe/hooks/calc/flow/use-shift-held';
import type { CalcFlowProps } from '@terrafirmagreg-team/recipe/types/calc-flow-props';

const nodeTypes = { calcMaterial: CalcNodeCard };
const edgeTypes = { calcEdge: CalcEdge };
const EMPTY_FLOW: AnyCalcFlowNode[] = [];
const EMPTY_EDGES: Edge[] = [];

function CalcFlowInner({
  nodes: schemeNodes,
  pipes,
  flows,
  cards,
  dataset,
  session,
  data,
  mode,
  onModeChange,
  farCards,
  onFarCardsChange,
  recipeIds,
  onRecipeIdsChange,
  snap,
  onSnapChange,
  notes,
  onAddNote,
  history,
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
  const { zoomIn, zoomOut, screenToFlowPosition } = useReactFlow();
  const domNode = useStore((s) => s.domNode);
  const shell = domNode?.parentElement ?? null;
  const addNoteCenter = useCallback(() => {
    if (!onAddNote) return;
    const rect = domNode?.getBoundingClientRect();
    onAddNote(
      screenToFlowPosition({
        x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
        y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
      }),
    );
  }, [onAddNote, domNode, screenToFlowPosition]);
  const shiftHeld = useShiftHeld();
  const [pipeEditId, setPipeEditId] = useState<string | null>(null);
  const pipeEdit = useMemo(
    () => ({
      edgeId: pipeEditId,
      open: setPipeEditId,
      close: () => setPipeEditId(null),
    }),
    [pipeEditId],
  );
  const addPosRef = useRef<{ x: number; y: number } | null>(null);
  const [matPick, setMatPick] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const {
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
  } = useFlowPickers(schemeNodes);

  const flowData = useMemo(
    () => ({ ...data, onRequestSupply, onRequestDemand }),
    [data, onRequestSupply, onRequestDemand],
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
    pipes,
    flows,
    cards,
    data,
    mode,
    onRequestPicker,
    onRequestMemberPicker,
    onRequestSupply,
    onRequestDemand,
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

  const boundsKey = useStore((s) => {
    let out = '';
    for (const node of s.nodeLookup.values()) {
      const hb = node.internals?.handleBounds;
      out +=
        `${node.id}:` +
        (hb?.source?.map((h) => h.id).join('+') ?? '') +
        '/' +
        (hb?.target?.map((h) => h.id).join('+') ?? '') +
        '|';
    }
    return out;
  });
  const readyEdges = useMemo(() => {
    const bounds = new Map<
      string,
      { src: Set<string | null>; tgt: Set<string | null> }
    >();
    for (const part of boundsKey.split('|')) {
      if (!part) continue;
      const [id, rest = ''] = part.split(':');
      const [src = '', tgt = ''] = rest.split('/');
      bounds.set(id, {
        src: new Set(src ? src.split('+') : []),
        tgt: new Set(tgt ? tgt.split('+') : []),
      });
    }
    return edges.filter(
      (e) =>
        bounds.get(e.source)?.src.has(e.sourceHandle ?? null) &&
        bounds.get(e.target)?.tgt.has(e.targetHandle ?? null),
    );
  }, [edges, boundsKey]);

  const [prevCanvasId, setPrevCanvasId] = useState(canvasId);
  if (prevCanvasId !== canvasId) {
    setPrevCanvasId(canvasId);
    resetNodes();
    setPickerNode(null);
    setMemberNode(null);
    setSupply(null);
    setDemand(null);
    setPipeEditId(null);
    setMatPick(null);
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
    openPipeEdit: pipeEdit.open,
    closePipeEdit: pipeEdit.close,
  });
  const closePicker = useCallback(() => setPickerNode(null), [setPickerNode]);
  const closeMember = useCallback(() => setMemberNode(null), [setMemberNode]);
  const closeSupply = useCallback(() => setSupply(null), [setSupply]);
  const closeDemand = useCallback(() => setDemand(null), [setDemand]);
  const runRelayout = useCallback(() => {
    onRelayout?.(relayout());
  }, [onRelayout, relayout]);

  return (
    <CalcSessionProvider value={session}>
      <CalcFarProvider value={farCards}>
      <CalcRecipeIdsProvider value={recipeIds}>
      <CalcTierProvider value={tier}>
      <ContextMenu>
      <ContextMenuTrigger
        className="contents"
        onContextMenu={(e) => {
          addPosRef.current = { x: e.clientX, y: e.clientY };
        }}
      >
      <CalcPipeEditProvider value={pipeEdit}>
      <FlowCanvas<AnyCalcFlowNode>
        shellProps={shellProps}
        className={cn(
          'calc-flow h-full min-h-0 flex-1',
          tier === 'dot' && 'calc-flow--dots',
          shiftHeld && 'calc-flow--shift',
        )}

        nodes={tier === 'dot' ? EMPTY_FLOW : nodes}
        edges={tier === 'dot' ? EMPTY_EDGES : readyEdges}
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
        snapToGrid={snap}
        snapGrid={[16, 16]}
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
        <CalcNotes notes={notes} snap={snap} data={flowData} />
        {shell
          ? createPortal(
              <>
                <CalcToolbar
                  onFit={onFit}
                  onRelayout={runRelayout}
                  onZoomIn={() => void zoomIn({ duration: 150 })}
                  onZoomOut={() => void zoomOut({ duration: 150 })}
                  onAddNote={onAddNote ? addNoteCenter : undefined}
                  actions={actions}
                  mode={mode}
                  onModeChange={onModeChange}
                  farCards={farCards}
                  onFarCardsChange={onFarCardsChange}
                  recipeIds={recipeIds}
                  onRecipeIdsChange={onRecipeIdsChange}
                  snap={snap}
                  onSnapChange={onSnapChange}
                  history={history}
                />
                <div className="pointer-events-auto absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md border border-border bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                  <FlaskConical className="size-3" />
                  {t('Experimental', { note: 'recipe.calc.experimental' })}
                </div>
              </>,
              shell,
            )
          : null}
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
      </CalcPipeEditProvider>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          className="whitespace-nowrap"
          onClick={() => {
            const pos = addPosRef.current;
            setMatPick(pos ? screenToFlowPosition(pos) : null);
          }}
        >
          <Target />
          {t('Add card', { note: 'recipe.calc.add.goal' })}
        </ContextMenuItem>
      </ContextMenuContent>
      </ContextMenu>
      {matPick ? (
        <CalcMaterialPicker
          open
          onOpenChange={(open) => {
            if (!open) setMatPick(null);
          }}
          index={session.index}
          dataset={dataset}
          lang={session.lang}
          langMap={session.langMap}
          onSelect={(id, kind) => {
            data.onAddCard(id, kind, matPick);
            setMatPick(null);
          }}
        />
      ) : null}
      <CalcPickers
        pickerNode={pickerNode}
        memberNode={memberNode}
        supply={supply}
        demand={demand}
        session={session}
        dataset={dataset}
        data={data}
        onClosePicker={closePicker}
        onCloseMember={closeMember}
        onCloseSupply={closeSupply}
        onCloseDemand={closeDemand}
      />
      </CalcTierProvider>
      </CalcRecipeIdsProvider>
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

