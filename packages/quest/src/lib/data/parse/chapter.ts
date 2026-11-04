import {
  asBool,
  asNumber,
  asRecord,
  asString,
} from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import type { Chapter } from '@terrafirmagreg-team/quest/lib/data/dto';
import { iconKindFor, itemIdsFrom } from './ids';
import { parseImage, parseLink, parseQuest } from './members';
import { mapEntries, stringList } from './rows';

const FTB_DEFAULT_SHAPE = 'circle';

const DUMPED_SHAPE_TEXTURES = new Set([
  'circle',
  'square',
  'diamond',
  'gear',
  'heart',
  'hexagon',
  'octagon',
]);

function shapeTextureLayers(shapeId: string) {
  const dir = shapeId.includes(':') ? shapeId : `ftbquests:${shapeId}`;
  const [ns, name] = dir.split(':');
  const base = `${ns}:textures/shapes/${name}`;
  return {
    shape: `${base}/shape.png`,
    background: `${base}/background.png`,
    outline: `${base}/outline.png`,
  };
}

function applyChapterDefaults(chapter: Chapter, bookShape?: string): void {
  const shape = chapter.defaultQuestShape || bookShape || FTB_DEFAULT_SHAPE;
  const hide = chapter.defaultHideDependencyLines;
  const usedShapes = new Set<string>();
  for (const quest of chapter.quests) {
    if (!quest.shape || quest.shape === 'default') quest.shape = shape;
    usedShapes.add(quest.shape);
  }
  for (const link of chapter.questLinks) {
    if (!link.shape || link.shape === 'default') link.shape = shape;
    usedShapes.add(link.shape);
  }
  for (const shapeId of usedShapes) {
    if (shapeId === 'none' || !DUMPED_SHAPE_TEXTURES.has(shapeId)) continue;
    chapter.shapeTextures ??= {};
    chapter.shapeTextures[shapeId] ??= shapeTextureLayers(shapeId);
  }
  if (hide) {
    for (const quest of chapter.quests) {
      if (quest.hideDependencyLines === undefined) quest.hideDependencyLines = true;
    }
  }
}

export function parseChapter(
  raw: unknown,
  ctx?: { filename?: string; id?: string; defaultQuestShape?: string },
): Chapter | undefined {
  const row = asRecord(raw);
  if (!row) return undefined;
  const quests = mapEntries(row.quests).flatMap(([key, item]) => {
    const parsed = parseQuest(item, key);
    return parsed ? [parsed] : [];
  });
  const filename =
    asString(row.filename) ??
    ctx?.filename ??
    asString(row.id) ??
    ctx?.id;
  if (!filename) return undefined;
  const id = asString(row.id) ?? ctx?.id ?? filename;
  const icon = itemIdsFrom(row.icon)[0] ?? asString(row.icon);
  const iconRow = asRecord(row.icon);
  const defaultQuestShape = asString(row.defaultQuestShape);
  const description = stringList(row.description);
  const chapter: Chapter = {
    id,
    filename,
    group: asString(row.group) || undefined,
    title: asString(row.title),
    subtitle: asString(row.subtitle),
    description: description.length ? description : undefined,
    icon,
    iconKind: iconKindFor(icon, iconRow),
    orderIndex: asNumber(row.orderIndex) ?? 0,
    autofocusId: asString(row.autofocusId),
    defaultQuestShape,
    defaultHideDependencyLines: asBool(row.defaultHideDependencyLines),
    quests,
    questLinks: mapEntries(row.questLinks).flatMap(([key, item]) => {
      const parsed = parseLink(item, key);
      return parsed ? [parsed] : [];
    }),
    images: (Array.isArray(row.images) ? row.images : []).flatMap((item) => {
      const entry = asRecord(item);
      const parsed = entry ? parseImage(entry) : undefined;
      return parsed ? [parsed] : [];
    }),
    shapeTextures: mapEntries(row.shapeTextures).reduce<
      NonNullable<Chapter['shapeTextures']>
    >((acc, [shapeId, layers]) => {
      const shape = asString(layers.shape);
      const background = asString(layers.background);
      const outline = asString(layers.outline);
      acc[shapeId] = {
        ...(shape ? { shape } : {}),
        ...(background ? { background } : {}),
        ...(outline ? { outline } : {}),
      };
      return acc;
    }, {}),
  };
  applyChapterDefaults(chapter, ctx?.defaultQuestShape);
  return chapter;
}

