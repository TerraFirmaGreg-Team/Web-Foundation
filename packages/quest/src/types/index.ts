import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { DatasetLanding } from '@terrafirmagreg-team/kit/types';
import type {
  Chapter,
  Quest,
  QuestCompactIndex,
} from '@terrafirmagreg-team/quest/lib/data/dto';
import type { Node } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';

export type { Chapter, Quest, QuestCompactIndex };

export type McTextStyle = {
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
};

export type RichTextNode =
  | { type: 'text'; text: string; style: McTextStyle }
  | { type: 'link'; href: string; children: RichTextNode[] }
  | { type: 'quest'; questId: string; children: RichTextNode[] };

export type QuestDescriptionBlock =
  | { type: 'paragraph'; nodes: RichTextNode[] }
  | {
      type: 'image';
      imageRef: string;
      width: number;
      height: number;
      align?: string;
    }
  | { type: 'break' };

export type ChapterImagePaint = {
  mediaOpacity?: number;
  tintRgb?: string;
  tintOpacity?: number;
};

export type QuestShapeId =
  | 'circle'
  | 'square'
  | 'rsquare'
  | 'diamond'
  | 'hexagon'
  | 'octagon'
  | 'pentagon'
  | 'heart'
  | 'gear'
  | 'none';

export type QuestPageData = DatasetLanding;

export type QuestFlowData = {
  kind: 'quest' | 'link';
  quest: Quest;
  dataset: DatasetRef;
  langMap: Record<string, string>;
  gridScale: number;
  questSpacing: number;
  targetFilename: string;
  shapeTextures?: Chapter['shapeTextures'];
};

type QuestFlowNode = Node<QuestFlowData, 'quest'>;
export type FlowNode = QuestFlowNode;

