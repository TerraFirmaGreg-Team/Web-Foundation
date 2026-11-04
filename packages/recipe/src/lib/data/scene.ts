import {
  asNumber,
  asRecord,
  asString,
} from '@terrafirmagreg-team/dump/lib/dump/contract/read';

export type RecipeSceneRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type RecipeMultiblockPart = {
  item: string;
  x: number;
  y: number;
};

export type RecipeMultiblockScene = {
  glb?: string;
  minY?: number;
  maxY?: number;
  bounds?: RecipeSceneRect;
  parts: RecipeMultiblockPart[];
};

function asRect(value: unknown): RecipeSceneRect | undefined {
  const row = asRecord(value);
  const x = asNumber(row?.x);
  const y = asNumber(row?.y);
  const w = asNumber(row?.w);
  const h = asNumber(row?.h);
  return x !== undefined && y !== undefined && w && h
    ? { x, y, w, h }
    : undefined;
}

export type RecipeSceneEntity = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  clip?: RecipeSceneRect;
  baked?: boolean;
};

export function recipeSceneEntities(
  properties: Record<string, unknown>,
): RecipeSceneEntity[] {
  const row = asRecord(properties.scene);
  const entities = Array.isArray(row?.entities) ? row.entities : [];
  return entities.flatMap((value): RecipeSceneEntity[] => {
    const entity = asRecord(value);
    const id = asString(entity?.id);
    const x = asNumber(entity?.x);
    const y = asNumber(entity?.y);
    const w = asNumber(entity?.w);
    const h = asNumber(entity?.h);
    return id && x !== undefined && y !== undefined
      ? [
          {
            id,
            x,
            y,
            w: w ?? 0,
            h: h ?? 0,
            ...(asRect(entity?.clip) ? { clip: asRect(entity?.clip) } : {}),
            ...(entity?.baked === true ? { baked: true } : {}),
          },
        ]
      : [];
  });
}

export function recipeMultiblock(
  properties: Record<string, unknown>,
): RecipeMultiblockScene | undefined {
  const row = asRecord(properties.multiblock);
  if (!row) return undefined;
  const parts = (Array.isArray(row.parts) ? row.parts : []).flatMap(
    (value): RecipeMultiblockPart[] => {
      const part = asRecord(value);
      const item = asString(part?.item);
      const x = asNumber(part?.x);
      const y = asNumber(part?.y);
      return item && x !== undefined && y !== undefined
        ? [{ item, x, y }]
        : [];
    },
  );
  const glb = asString(row.glb);
  if (!glb && !parts.length) return undefined;
  return {
    ...(glb ? { glb } : {}),
    ...(asNumber(row.minY) !== undefined ? { minY: asNumber(row.minY) } : {}),
    ...(asNumber(row.maxY) !== undefined ? { maxY: asNumber(row.maxY) } : {}),
    ...(asRect(row.bounds) ? { bounds: asRect(row.bounds) } : {}),
    parts,
  };
}

