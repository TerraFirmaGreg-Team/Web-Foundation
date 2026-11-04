import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { dumpTextureUrl } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { gridToPx } from '@terrafirmagreg-team/quest/lib/grid';
import type { ChapterImage } from '@terrafirmagreg-team/quest/lib/data/dto';
import type { ChapterImagePaint } from '@terrafirmagreg-team/quest/types';

const COLOR4I_WHITE_RGB = 0xffffff;
const MINECRAFT_DEFAULT_FRAME_TIME = 2;

export function isAnimatedChapterImage(image: ChapterImage): boolean {
  return Boolean(image.animated && image.frameCount && image.frameCount > 1);
}

function inferVerticalStripFrames(
  naturalWidth: number,
  naturalHeight: number,
): number | undefined {
  if (naturalWidth <= 0 || naturalHeight <= naturalWidth) return undefined;
  if (naturalHeight % naturalWidth !== 0) return undefined;
  const frames = naturalHeight / naturalWidth;
  return frames > 1 ? frames : undefined;
}

export function withInferredChapterSprite(
  image: ChapterImage,
  naturalWidth: number,
  naturalHeight: number,
): ChapterImage {
  if (isAnimatedChapterImage(image)) return image;
  const frames = inferVerticalStripFrames(naturalWidth, naturalHeight);
  if (!frames) return image;
  return {
    ...image,
    animated: true,
    frameCount: frames,
    frameTime: image.frameTime ?? MINECRAFT_DEFAULT_FRAME_TIME,
  };
}

export function chapterImagePaint(
  image: ChapterImage,
): ChapterImagePaint | undefined {
  const alpha = image.alpha ?? 255;
  const hasTint = image.color != null && image.color !== COLOR4I_WHITE_RGB;
  const hasAlpha = alpha < 255;
  if (!hasTint && !hasAlpha) return undefined;

  const a = Math.max(0, Math.min(1, alpha / 255));
  if (!hasTint) return { mediaOpacity: a };

  const rgb = image.color ?? COLOR4I_WHITE_RGB;
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  return { tintRgb: `rgb(${r}, ${g}, ${b})`, tintOpacity: a };
}

export function chapterImageLayout(image: ChapterImage, gridScale: number) {
  const widthPx = gridToPx(image.w, gridScale);
  const heightPx = gridToPx(image.h, gridScale);
  const anchorX = gridToPx(image.x, gridScale);
  const anchorY = gridToPx(image.y, gridScale);
  if (image.alignToCorner) {
    return { x: anchorX + widthPx / 2, y: anchorY + heightPx / 2, widthPx, heightPx };
  }
  return { x: anchorX, y: anchorY, widthPx, heightPx };
}

export function chapterImageTransformOrigin(alignToCorner?: boolean): string {
  return alignToCorner ? 'top left' : 'center center';
}

function parseClick(click: string): { scheme: string; path: string } {
  const index = click.indexOf(':');
  if (index === -1) return { scheme: '', path: click };
  return { scheme: click.slice(0, index), path: click.slice(index + 1) };
}

export function chapterImageClickHref(
  click: string | null | undefined,
): string | null {
  if (!click) return null;
  const { scheme, path } = parseClick(click);
  if (scheme === 'http' || scheme === 'https') return `${scheme}:${path}`;
  return null;
}

function resolveFrameSequence(image: ChapterImage): number[] {
  const textureFrames = image.frameCount ?? 1;
  if (image.frameSequence?.length) return image.frameSequence;
  return Array.from({ length: textureFrames }, (_, index) => index);
}

export function chapterSpriteTextureFrame(
  image: ChapterImage,
  now = Date.now(),
): number {
  if (!isAnimatedChapterImage(image)) return 0;
  const sequence = resolveFrameSequence(image);
  const frameTime = image.frameTime ?? MINECRAFT_DEFAULT_FRAME_TIME;
  const msPerStep = frameTime * 50;
  const cycleMs = sequence.length * msPerStep;
  const elapsed = now % cycleMs;
  const seqIndex = Math.floor(elapsed / msPerStep) % sequence.length;
  return sequence[seqIndex] ?? 0;
}

export function chapterSpriteAnimationIntervalMs(
  image: ChapterImage,
): number | undefined {
  if (!isAnimatedChapterImage(image)) return undefined;
  const frameTime = image.frameTime ?? MINECRAFT_DEFAULT_FRAME_TIME;
  return frameTime * 50;
}

export function chapterSpriteBackgroundY(
  textureFrameIndex: number,
  textureFrameCount: number,
): string {
  if (textureFrameCount <= 1) return '0';
  const clamped = Math.max(
    0,
    Math.min(textureFrameIndex, textureFrameCount - 1),
  );
  return `${(clamped / (textureFrameCount - 1)) * 100}%`;
}

export function questTexturePublicUrl(
  dataset: DatasetRef,
  ref: string,
): string | undefined {
  return dumpTextureUrl(dataset, ref);
}

