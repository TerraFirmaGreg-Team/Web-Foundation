'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { memo, useCallback, useMemo } from 'react';
import {
  ReactFlowProvider,
  useReactFlow,
  type DefaultEdgeOptions,
  type Node,
} from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import {
  DEFAULT_GRID_SCALE,
  DEFAULT_QUEST_SPACING,
  QUEST_ZOOM_BASE,
  gridStepPx,
  questNodeOuterPx,
} from '@terrafirmagreg-team/quest/lib/grid';
import { isQuestVisibleOnMap } from '@terrafirmagreg-team/quest/lib/data/parse';
import type {
  Chapter,
  QuestCompactIndex,
} from '@terrafirmagreg-team/quest/lib/data/dto';
import { chapterToFlow, isQuestFlowData } from '@terrafirmagreg-team/quest/lib/flow';
import { chapterImageLayout } from '@terrafirmagreg-team/quest/lib/image';
import { ChapterImages } from '@terrafirmagreg-team/quest/components/views/canvas/chapter-images';
import { DependencyEdge } from '@terrafirmagreg-team/quest/components/views/canvas/dependency-edge';
import { QuestNode } from '@terrafirmagreg-team/quest/components/views/canvas/node';
import { FlowCanvas } from '@terrafirmagreg-team/ui/components/blocks/canvas/flow-canvas';
import { FlowToolbar } from '@terrafirmagreg-team/ui/components/blocks/canvas/flow-toolbar';
import {
  FlowHoverContext,
  useFlowHover,
} from '@terrafirmagreg-team/ui/hooks/canvas/use-flow-hover';
import { useMediaQuery } from '@terrafirmagreg-team/ui/hooks/use-media-query';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import {
  applyNodeSelection,
  decorateFlowEdges,
} from '@terrafirmagreg-team/ui/lib/canvas/state';
import type { FlowNode } from '@terrafirmagreg-team/quest/types';
import { viewportStorageKey } from '@terrafirmagreg-team/quest/lib/viewport';

const EDGE_OPTIONS: DefaultEdgeOptions = {
  type: 'questDependency',
};

const nodeTypes = { quest: QuestNode };
const edgeTypes = { questDependency: DependencyEdge };

function CanvasInner({
  chapter,
  dataset,
  langMap,
  gridScale,
  questSpacing,
  index,
  selectedId,
  suppressPanRef,
  onSelectQuest,
  onOpenSearch,
}: {
  chapter: Chapter;
  dataset: DatasetRef;
  langMap: Record<string, string>;
  gridScale: number;
  questSpacing: number;
  index: QuestCompactIndex | null;
  selectedId: string | null;
  suppressPanRef?: { current: string | null };
  onSelectQuest: (
    id: string,
    filename: string,
    kind: 'quest' | 'link',
  ) => void;
  onOpenSearch?: () => void;
}) {
  const t = useTranslations();
  const coarse = useMediaQuery('(pointer: coarse)');
  const { screenToFlowPosition } = useReactFlow();
  const hover = useFlowHover();
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () =>
      chapterToFlow(chapter, dataset, langMap, gridScale, questSpacing, index),
    [chapter, dataset, gridScale, index, langMap, questSpacing],
  );
  const nodes = useMemo(
    () => applyNodeSelection(layoutNodes, selectedId, 'quest'),
    [layoutNodes, selectedId],
  );
  const edges = useMemo(
    () => decorateFlowEdges(layoutEdges, hover.id, selectedId),
    [hover.id, layoutEdges, selectedId],
  );

  const imageRects = useMemo(
    () =>
      chapter.images.map((image) => {
        const layout = chapterImageLayout(image, gridScale);
        return {
          x: layout.x,
          y: layout.y,
          width: layout.widthPx,
          height: layout.heightPx,
        };
      }),
    [chapter.images, gridScale],
  );

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      if (node.type !== 'quest' || !isQuestFlowData(node.data)) return;
      onSelectQuest(
        node.data.quest.id,
        node.data.targetFilename,
        node.data.kind,
      );
    },
    [onSelectQuest],
  );

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      for (let i = layoutNodes.length - 1; i >= 0; i--) {
        const node = layoutNodes[i];
        if (node.type !== 'quest' || !isQuestFlowData(node.data)) continue;
        const w =
          node.measured?.width ??
          questNodeOuterPx(node.data.quest, gridScale, questSpacing);
        const h = node.measured?.height ?? w;
        if (
          Math.abs(pos.x - node.position.x) <= w / 2 &&
          Math.abs(pos.y - node.position.y) <= h / 2
        ) {
          onSelectQuest(
            node.data.quest.id,
            node.data.targetFilename,
            node.data.kind,
          );
          return;
        }
      }
    },
    [
      screenToFlowPosition,
      layoutNodes,
      gridScale,
      questSpacing,
      onSelectQuest,
    ],
  );

  const empty =
    !chapter.quests.some(isQuestVisibleOnMap) &&
    !chapter.questLinks.length &&
    !chapter.images.length;

  if (empty) {
    return (
      <div className="viewport-shell not-prose relative w-full overflow-hidden">
        <p className="p-4 text-sm text-muted-foreground">
          {chapter.filename}
        </p>
      </div>
    );
  }

  return (
    <FlowHoverContext.Provider value={hover}>
      <FlowCanvas<FlowNode>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={EDGE_OPTIONS}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodesDraggable={false}
        backgroundGap={Math.max(12, Math.round(gridStepPx(gridScale) / 3))}
        viewportConfig={{
          storageKey: viewportStorageKey(dataset, chapter.filename),
          resetKey: `${dataset.id}/${dataset.version ?? ''}:${chapter.filename}`,
          selectedId,
          suppressPanRef,
          focusZoom: QUEST_ZOOM_BASE,
          restoreViewport: !coarse,
          persist: true,
        }}
        extraRects={imageRects}
      >
        {({ onFit }) => (
          <>
            <ChapterImages
              images={chapter.images}
              dataset={dataset}
              gridScale={gridScale}
            />
            <FlowToolbar
              onFit={onFit}
              search={
                onOpenSearch
                  ? { label: t('Search quests', { note: 'quest.search' }), onOpen: onOpenSearch }
                  : undefined
              }
            />
          </>
        )}
      </FlowCanvas>
    </FlowHoverContext.Provider>
  );
}

export const CanvasFlow = memo(function CanvasFlow({
  chapter,
  dataset,
  langMap,
  gridScale = DEFAULT_GRID_SCALE,
  questSpacing = DEFAULT_QUEST_SPACING,
  index,
  selectedId,
  suppressPanRef,
  onSelectQuest,
  onOpenSearch,
}: {
  chapter: Chapter;
  dataset: DatasetRef;
  langMap: Record<string, string>;
  gridScale?: number;
  questSpacing?: number;
  index: QuestCompactIndex | null;
  selectedId: string | null;
  suppressPanRef?: { current: string | null };
  onSelectQuest: (
    id: string,
    filename: string,
    kind: 'quest' | 'link',
  ) => void;
  onOpenSearch?: () => void;
}) {
  return (
    <ReactFlowProvider>
      <CanvasInner
        chapter={chapter}
        dataset={dataset}
        langMap={langMap}
        gridScale={gridScale}
        questSpacing={questSpacing}
        index={index}
        selectedId={selectedId}
        suppressPanRef={suppressPanRef}
        onSelectQuest={onSelectQuest}
        onOpenSearch={onOpenSearch}
      />
    </ReactFlowProvider>
  );
});

