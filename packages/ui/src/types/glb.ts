import type { OrbitControls } from '@react-three/drei';
import type { ComponentRef } from 'react';

export type GlbOrbitControls = ComponentRef<typeof OrbitControls>;

export type GlbHomeView = {
  position: [number, number, number];
  target: [number, number, number];
};

export type GlbSceneHandle = {
  zoomBy: (factor: number) => void;
  reset: () => void;
};

export type GlbSessionProps = {
  src?: string | null;
  sources?: string[];
  title?: string;
  scale?: number;
  offset?: number;
  bare?: boolean;

  resolveResource?: (resourceUrl: string, modelUrl: string) => string | undefined;
};

