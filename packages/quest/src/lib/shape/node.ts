import { type Point, questShapeBorderToward } from './geometry';

function questShapeFromNodeData(data: unknown): string | undefined {
  if (typeof data !== 'object' || data == null || !('quest' in data)) {
    return undefined;
  }
  const quest = (data as { quest?: { shape?: string } }).quest;
  return quest?.shape;
}

type SizedNode = {
  measured?: { width?: number; height?: number };
  width?: number;
  height?: number;
  initialWidth?: number;
  initialHeight?: number;
  internals: { positionAbsolute: Point };
  data?: unknown;
};

function questNodeSize(node: SizedNode): {
  width: number;
  height: number;
} {
  return {
    width: node.measured?.width ?? node.width ?? node.initialWidth ?? 48,
    height: node.measured?.height ?? node.height ?? node.initialHeight ?? 48,
  };
}

export function questNodeCenter(node: SizedNode): Point {
  const { width, height } = questNodeSize(node);
  const { x, y } = node.internals.positionAbsolute;
  return { x: x + width / 2, y: y + height / 2 };
}

export function questNodeBorderToward(node: SizedNode, toward: Point): Point {
  const center = questNodeCenter(node);
  const { width, height } = questNodeSize(node);
  const shape = questShapeFromNodeData(node.data);
  return questShapeBorderToward(center, toward, width / 2, height / 2, shape);
}

