'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import {
  chapterSpriteAnimationIntervalMs,
  chapterSpriteBackgroundY,
  chapterSpriteTextureFrame,
  isAnimatedChapterImage,
} from '@terrafirmagreg-team/quest/lib/image';
import type { ChapterImage } from '@terrafirmagreg-team/quest/lib/data/dto';

export function useChapterSpriteStyle(
  image: ChapterImage,
): CSSProperties | undefined {
  const textureFrames = image.frameCount ?? 1;
  const msPerStep = chapterSpriteAnimationIntervalMs(image) ?? 100;
  const [backgroundPosition, setBackgroundPosition] = useState('0 0');

  useEffect(() => {
    if (!isAnimatedChapterImage(image)) return undefined;
    const update = () => {
      const textureFrame = chapterSpriteTextureFrame(image);
      setBackgroundPosition(
        `0 ${chapterSpriteBackgroundY(textureFrame, textureFrames)}`,
      );
    };
    update();
    const id = window.setInterval(update, msPerStep);
    return () => window.clearInterval(id);
  }, [image, msPerStep, textureFrames]);

  if (!isAnimatedChapterImage(image)) return undefined;
  return {
    ['--chapter-sprite-frame-count' as string]: String(textureFrames),
    backgroundPosition,
    backgroundSize: `100% ${textureFrames * 100}%`,
    backgroundRepeat: 'no-repeat',
  };
}

