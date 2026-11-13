'use client';

import { useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three-stdlib';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  type RefObject,
  useRef,
} from 'react';
import {
  Box3,
  type Group,
  LinearMipmapLinearFilter,
  LoadingManager,
  type Material,
  MathUtils,
  type Mesh,
  type MeshStandardMaterial,
  NearestFilter,
  type PerspectiveCamera,
  SRGBColorSpace,
  Texture,
  Vector3,
} from 'three';
import type {
  GlbHomeView,
  GlbOrbitControls,
  GlbSceneHandle,
} from '@terrafirmagreg-team/ui/types/glb';

const GLB_ZOOM_MIN_FACTOR = 0.4;
const GLB_ZOOM_MAX_FACTOR = 3;

type ResourceResolver = (
  resourceUrl: string,
  modelUrl: string,
) => string | undefined;

const glbLoaderClasses = new WeakMap<
  ResourceResolver,
  Map<string, typeof GLTFLoader>
>();
const loaderModifiers = new WeakMap<
  object,
  (resourceUrl: string) => string
>();

export function glbLoaderClass(
  modelSource: string,
  resolveResource?: ResourceResolver,
): typeof GLTFLoader {
  if (!resolveResource) return GLTFLoader;
  let byUrl = glbLoaderClasses.get(resolveResource);
  if (!byUrl) {
    byUrl = new Map();
    glbLoaderClasses.set(resolveResource, byUrl);
  }
  let cls = byUrl.get(modelSource);
  if (!cls) {
    cls = class extends GLTFLoader {
      constructor() {
        const manager = new LoadingManager();
        super(manager);
        const modifier = loaderModifiers.get(this.constructor);
        if (modifier) manager.setURLModifier(modifier);
      }
    };
    loaderModifiers.set(
      cls,
      (resourceUrl) => resolveResource(resourceUrl, modelSource) ?? resourceUrl,
    );
    byUrl.set(modelSource, cls);
  }
  return cls;
}

export function GlbModel({
  url,
  flip,
  scale,
  offset,
  controlsRef,
  homeRef,
  initializedRef,
  resolveResource,
  onReady,
}: {
  url: string;
  flip: boolean;
  scale?: number;
  offset?: number;
  controlsRef: RefObject<GlbOrbitControls | null>;
  homeRef: RefObject<GlbHomeView | null>;
  initializedRef: RefObject<boolean>;
  resolveResource?: ResourceResolver;
  onReady: () => void;
}) {
  const { scene } = useLoader(
    glbLoaderClass(url, resolveResource),
    url,
  ) as { scene: Group };
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      const mesh = object as Mesh;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : [];
      for (const material of materials) {
        const std = material as MeshStandardMaterial;
        const map = std.map;
        if (map) {
          map.colorSpace = SRGBColorSpace;
          map.magFilter = NearestFilter;
          map.minFilter = LinearMipmapLinearFilter;
          map.anisotropy = 4;
          map.needsUpdate = true;
        }
        const color = mesh.geometry?.getAttribute('color');
        if (std.vertexColors && color) {
          let uniformWhite = true;
          for (let i = 0; i < color.count * color.itemSize; i++) {
            if ((color.array as ArrayLike<number>)[i] < 0.99) {
              uniformWhite = false;
              break;
            }
          }
          if (uniformWhite) {
            std.vertexColors = false;
            std.needsUpdate = true;
          }
        }
      }
    });
    return clone;
  }, [scene]);
  const modelRef = useRef<Group>(null);

  useEffect(() => {
    return () => {
      model.traverse((object) => {
        const mesh = object as Mesh;
        mesh.geometry?.dispose?.();
        const material = mesh.material as Material | Material[] | undefined;
        for (const entry of Array.isArray(material)
          ? material
          : material
            ? [material]
            : []) {
          for (const value of Object.values(entry)) {
            if (value instanceof Texture) value.dispose();
          }
          entry.dispose();
        }
      });
    };
  }, [model]);
  const controlsReady = useThree((state) => state.controls != null);

  useLayoutEffect(() => {
    const controls = controlsRef.current;
    const root = modelRef.current;
    if (!controls || !root) return;
    const camera = controls.object as PerspectiveCamera;
    const box = new Box3().setFromObject(root);
    const size = box.getSize(new Vector3()).length() || 1;
    const center = box.getCenter(new Vector3());
    const orbit = camera.position.clone().sub(controls.target);
    controls.minDistance = size * GLB_ZOOM_MIN_FACTOR;
    controls.maxDistance = size * GLB_ZOOM_MAX_FACTOR;
    controls.target.copy(center);
    if (initializedRef.current && orbit.lengthSq() > 0) {
      camera.position.copy(center).add(orbit);
    } else {
      camera.position.copy(center).add(new Vector3(size, size * 0.7, size));
    }
    camera.near = size / 50;
    camera.far = size * 15;
    camera.updateProjectionMatrix();
    controls.update();
    initializedRef.current = true;
    homeRef.current = {
      position: camera.position.toArray() as [number, number, number],
      target: controls.target.toArray() as [number, number, number],
    };
    onReady();
  }, [controlsReady, controlsRef, homeRef, initializedRef, onReady, url]);

  return (
    <group ref={modelRef}>
      <primitive
        object={model}
        rotation-x={flip ? Math.PI : 0}
        scale={
          typeof scale === 'number' && Number.isFinite(scale) && scale !== 0
            ? Math.abs(scale)
            : 1
        }
        position-y={
          typeof offset === 'number' && Number.isFinite(offset) ? offset : 0
        }
      />
    </group>
  );
}

export const GlbSceneApi = forwardRef<
  GlbSceneHandle,
  {
    controlsRef: RefObject<GlbOrbitControls | null>;
    homeRef: RefObject<GlbHomeView | null>;
  }
>(function GlbSceneApi({ controlsRef, homeRef }, ref) {
  useImperativeHandle(
    ref,
    () => ({
      zoomBy(factor: number) {
        const controls = controlsRef.current;
        if (!controls) return;
        const camera = controls.object;
        const offset = camera.position.clone().sub(controls.target);
        const length = MathUtils.clamp(
          offset.length() * factor,
          controls.minDistance,
          controls.maxDistance,
        );
        camera.position.copy(controls.target).add(offset.setLength(length));
        controls.update();
      },
      reset() {
        const controls = controlsRef.current;
        const home = homeRef.current;
        if (!controls || !home) return;
        const camera = controls.object;
        camera.position.set(...home.position);
        controls.target.set(...home.target);
        controls.update();
      },
    }),
    [controlsRef, homeRef],
  );
  return null;
});

