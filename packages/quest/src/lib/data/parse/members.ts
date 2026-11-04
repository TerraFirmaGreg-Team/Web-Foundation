import {
  asBool,
  asNumber,
  asRecord,
  asString,
} from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import type {
  ChapterImage,
  Quest,
  QuestLink,
} from '@terrafirmagreg-team/quest/lib/data/dto';
import { iconKindFor, itemIdsFrom } from './ids';
import { mapEntries, numberList, stringList } from './rows';
import { parseReward, parseTask } from './tasks';

export function parseQuest(
  row: Record<string, unknown>,
  key: string,
): Quest | undefined {
  const id = asString(row.id) ?? key;
  if (!id) return undefined;
  const description = stringList(row.description);
  const icon = itemIdsFrom(row.icon)[0] ?? asString(row.icon);
  const iconRow = asRecord(row.icon);
  return {
    id,
    x: asNumber(row.x) ?? 0,
    y: asNumber(row.y) ?? 0,
    size: asNumber(row.size),
    shape: asString(row.shape),
    title: asString(row.title),
    subtitle: asString(row.subtitle),
    description: description.length ? description : undefined,
    icon,
    iconKind: iconKindFor(icon, iconRow),
    image: asString(row.image),
    dependencies: stringList(row.dependencies),
    tasks: mapEntries(row.tasks).flatMap(([key2, item]) => {
      const parsed = parseTask(item, key2);
      return parsed ? [parsed] : [];
    }),
    rewards: mapEntries(row.rewards).flatMap(([key2, item]) => {
      const parsed = parseReward(item, key2);
      return parsed ? [parsed] : [];
    }),
    guidePage: asString(row.guidePage),
    optional: asBool(row.optional),
    invisible: asBool(row.invisible),
    hideDependencyLines: asBool(row.hideDependencyLines),
    hideDependentLines: asBool(row.hideDependentLines),
    canRepeat: asBool(row.canRepeat),
    minWidth: asNumber(row.minWidth),
  };
}

export function parseLink(
  row: Record<string, unknown>,
  key: string,
): QuestLink | undefined {
  const id = asString(row.id) ?? key;
  const linkedQuest = asString(row.linkedQuest);
  if (!id || !linkedQuest) return undefined;
  return {
    id,
    linkedQuest,
    x: asNumber(row.x) ?? 0,
    y: asNumber(row.y) ?? 0,
    size: asNumber(row.size),
    shape: asString(row.shape),
    icon: itemIdsFrom(row.icon)[0] ?? asString(row.icon),
  };
}

export function parseImage(
  row: Record<string, unknown>,
): ChapterImage | undefined {
  const image = asString(row.image);
  if (!image) return undefined;
  const frameSequence = numberList(row.frameSequence);
  const frameCount =
    asNumber(row.frameCount) ??
    (frameSequence.length ? frameSequence.length : undefined);
  return {
    image,
    x: asNumber(row.x) ?? 0,
    y: asNumber(row.y) ?? 0,
    w: asNumber(row.w) ?? 0,
    h: asNumber(row.h) ?? 0,
    rotation: asNumber(row.rotation),
    click: asString(row.click),
    alpha: asNumber(row.alpha),
    color: asNumber(row.color),
    alignToCorner: asBool(row.alignToCorner),
    animated:
      asBool(row.animated) ??
      (frameCount != null && frameCount > 1 ? true : undefined),
    frameCount,
    frameTime: asNumber(row.frameTime),
    frameSequence: frameSequence.length ? frameSequence : undefined,
    frameW: asNumber(row.frameW),
    frameH: asNumber(row.frameH),
  };
}

