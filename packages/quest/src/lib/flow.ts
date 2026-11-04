import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Edge } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { questTaskIconRefs } from '@terrafirmagreg-team/quest/lib/display';
import { stackIdFromRef } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import {
  DEFAULT_QUEST_NODE_SIZE,
  gridToPx,
  questNodeOuterPx,
} from '@terrafirmagreg-team/quest/lib/grid';
import { isQuestVisibleOnMap } from '@terrafirmagreg-team/quest/lib/data/parse';
import type {
  Chapter,
  Quest,
  QuestCompactIndex,
} from '@terrafirmagreg-team/quest/lib/data/dto';
import type { FlowNode, QuestFlowData } from '@terrafirmagreg-team/quest/types';

const EDGE_HANDLE = 'edge';

export function isQuestFlowData(data: unknown): data is QuestFlowData {
  return (
    typeof data === 'object' &&
    data != null &&
    'quest' in data &&
    typeof (data as QuestFlowData).quest?.id === 'string'
  );
}

function stubQuest(
  id: string,
  x: number,
  y: number,
  size: number | undefined,
  shape: string | undefined,
  row:
    | {
        title?: string;
        subtitle?: string;
        description?: string[];
        icon?: string;
        iconKind?: Quest['iconKind'];
        tasks?: Quest['tasks'];
      }
    | undefined,
  linkIcon?: string,
): Quest {
  const tasks = row?.tasks ?? [];
  const icon = questTaskIconRefs({
    icon: linkIcon ?? row?.icon,
    iconKind: linkIcon ? undefined : row?.iconKind,
    tasks,
  })[0];
  return {
    id,
    x,
    y,
    size,
    shape,
    title: row?.title,
    subtitle: row?.subtitle,
    description: row?.description,
    icon: icon ? stackIdFromRef(icon) : undefined,
    iconKind: icon?.kind,
    dependencies: [],
    tasks,
    rewards: [],
  };
}

type DepInfo = {
  dependencies: string[];
  invisible?: boolean;
  hideDependencyLines?: boolean;
  hideDependentLines?: boolean;
};

function visibleDepEnds(
  dep: string,
  depInfo: Map<string, DepInfo>,
  seen: Set<string>,
): string[] {
  if (seen.has(dep)) return [];
  seen.add(dep);
  const hop = depInfo.get(dep);
  if (hop?.invisible) {
    return hop.dependencies.flatMap((next) =>
      visibleDepEnds(next, depInfo, seen),
    );
  }
  return [dep];
}

export function chapterToFlow(
  chapter: Chapter,
  dataset: DatasetRef,
  langMap: Record<string, string>,
  gridScale: number,
  questSpacing: number,
  index: QuestCompactIndex | null,
): { nodes: FlowNode[]; edges: Edge[] } {
  const nodes: FlowNode[] = [];
  const visible = new Set(
    chapter.quests.filter(isQuestVisibleOnMap).map((quest) => quest.id),
  );
  const indexById = new Map(
    (index?.quests ?? []).map((row) => [row.id, row]),
  );
  const depInfo = new Map<string, DepInfo>();
  for (const quest of chapter.quests) {
    depInfo.set(quest.id, {
      dependencies: quest.dependencies,
      invisible: quest.invisible,
      hideDependencyLines: quest.hideDependencyLines,
      hideDependentLines: quest.hideDependentLines,
    });
  }
  for (const row of index?.quests ?? []) {
    if (!depInfo.has(row.id)) {
      depInfo.set(row.id, {
        dependencies: row.dependencies,
        invisible: row.invisible,
        hideDependencyLines: row.hideDependencyLines,
        hideDependentLines: row.hideDependentLines,
      });
    }
  }

  for (const quest of chapter.quests) {
    if (!visible.has(quest.id)) continue;
    const size = questNodeOuterPx(quest, gridScale, questSpacing);
    nodes.push({
      id: quest.id,
      type: 'quest',
      position: {
        x: gridToPx(quest.x, gridScale),
        y: gridToPx(quest.y, gridScale),
      },
      data: {
        kind: 'quest',
        quest,
        dataset,
        langMap,
        gridScale,
        questSpacing,
        targetFilename: chapter.filename,
        shapeTextures: chapter.shapeTextures,
      },
      width: size,
      height: size,
      style: {
        width: size,
        height: size,
        background: 'transparent',
        border: 'none',
        padding: 0,
      },
      zIndex: 1,
    });
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  for (const link of chapter.questLinks) {
    const row = indexById.get(link.linkedQuest);
    if (row?.invisible) continue;
    if (nodeIds.has(link.id)) continue;
    const size = questNodeOuterPx(
      { size: link.size ?? DEFAULT_QUEST_NODE_SIZE },
      gridScale,
      questSpacing,
    );
    const quest = stubQuest(
      link.linkedQuest,
      link.x,
      link.y,
      link.size,
      link.shape,
      row,
      link.icon,
    );
    nodes.push({
      id: link.id,
      type: 'quest',
      position: {
        x: gridToPx(link.x, gridScale),
        y: gridToPx(link.y, gridScale),
      },
      data: {
        kind: 'link',
        quest,
        dataset,
        langMap,
        gridScale,
        questSpacing,
        targetFilename: row?.filename ?? chapter.filename,
        shapeTextures: chapter.shapeTextures,
      },
      width: size,
      height: size,
      style: {
        width: size,
        height: size,
        background: 'transparent',
        border: 'none',
        padding: 0,
      },
      zIndex: 1,
    });
    nodeIds.add(link.id);
  }

  const nodesByQuest = new Map<string, string[]>();
  const pushNode = (questId: string, nodeId: string) => {
    const list = nodesByQuest.get(questId);
    if (list) list.push(nodeId);
    else nodesByQuest.set(questId, [nodeId]);
  };
  for (const quest of chapter.quests) {
    if (visible.has(quest.id)) pushNode(quest.id, quest.id);
  }
  for (const link of chapter.questLinks) {
    if (!nodeIds.has(link.id)) continue;
    pushNode(link.id, link.id);
    pushNode(link.linkedQuest, link.id);
  }

  const edges: Edge[] = [];
  const edgeIds = new Set<string>();
  for (const [questId, owner] of depInfo) {
    const targets = nodesByQuest.get(questId);
    if (!targets) continue;
    for (const dep of owner.dependencies) {
      for (const end of visibleDepEnds(dep, depInfo, new Set())) {
        const sources = nodesByQuest.get(end);
        if (!sources) continue;
        const src = depInfo.get(end);
        for (const source of sources) {
          for (const target of targets) {
            if (source === target) continue;
            const id = `${source}->${target}`;
            if (edgeIds.has(id)) continue;
            edgeIds.add(id);
            edges.push({
              id,
              source,
              target,
              sourceHandle: EDGE_HANDLE,
              targetHandle: EDGE_HANDLE,
              type: 'questDependency',
              data: {
                hideTarget: owner.hideDependencyLines === true,
                hideSource: src?.hideDependentLines === true,
              },
            });
          }
        }
      }
    }
  }

  return { nodes, edges };
}

