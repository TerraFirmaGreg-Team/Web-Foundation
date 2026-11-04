'use client';

import {
  boolCodec,
  createStoredValue,
  numberCodec,
} from '@terrafirmagreg-team/ui/lib/utils/stored-value';

export const AUTOPLAY_SPEED_MIN = 1;
export const AUTOPLAY_SPEED_MAX = 10;
export const ROTATE_MIN = 0;
export const ROTATE_MAX = 4;
export const SCENE_WIDTH_MIN = 50;
export const SCENE_WIDTH_MAX = 100;
export const SCENE_HEIGHT_MIN = 160;
export const SCENE_HEIGHT_MAX = 640;

export const useAutoplay = createStoredValue(
  'wiki.viewer.autoplay',
  boolCodec(true),
);

export const useAutoplaySpeed = createStoredValue(
  'wiki.viewer.autoplaySpeed',
  numberCodec(4, AUTOPLAY_SPEED_MIN, AUTOPLAY_SPEED_MAX),
);

const useAutoRotate = createStoredValue(
  'wiki.viewer.glb.autoRotate',
  boolCodec(true),
);

const useRotateSpeed = createStoredValue(
  'wiki.viewer.glb.rotateSpeed',
  numberCodec(1, ROTATE_MIN, ROTATE_MAX),
);

const useDotGrid = createStoredValue(
  'wiki.viewer.glb.dotGrid',
  boolCodec(true),
);

const useSceneWidth = createStoredValue(
  'wiki.viewer.glb.width',
  numberCodec(SCENE_WIDTH_MAX, SCENE_WIDTH_MIN, SCENE_WIDTH_MAX),
);

const useSceneHeight = createStoredValue(
  'wiki.viewer.glb.height',
  numberCodec(288, SCENE_HEIGHT_MIN, SCENE_HEIGHT_MAX),
);

export function useViewerPrefs() {
  const [autoplay, setAutoplay] = useAutoplay();
  const [autoplaySpeed, setAutoplaySpeed] = useAutoplaySpeed();
  const [autoRotate, setAutoRotate] = useAutoRotate();
  const [rotateSpeed, setRotateSpeed] = useRotateSpeed();
  const [dotGrid, setDotGrid] = useDotGrid();
  const [sceneWidth, setSceneWidth] = useSceneWidth();
  const [sceneHeight, setSceneHeight] = useSceneHeight();
  return {
    autoplay,
    setAutoplay,
    autoplaySpeed,
    setAutoplaySpeed,
    autoRotate,
    setAutoRotate,
    rotateSpeed,
    setRotateSpeed,
    dotGrid,
    setDotGrid,
    sceneWidth,
    setSceneWidth,
    sceneHeight,
    setSceneHeight,
  };
}

