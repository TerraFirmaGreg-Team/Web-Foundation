'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas, useLoader } from '@react-three/fiber';
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Gauge,
  Grid3x3,
  MoveHorizontal,
  MoveVertical,
  Play,
  RotateCw,
  Timer,
} from 'lucide-react';
import type { WebGLRenderer } from 'three';
import {
  ViewerToolbar,
  ViewerControls,
} from '@terrafirmagreg-team/ui/components/blocks/viewer/controls';
import {
  GlbModel,
  glbLoaderClass,
  GlbSceneApi,
} from '@terrafirmagreg-team/ui/components/blocks/media/glb/model';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useCycleIndex } from '@terrafirmagreg-team/ui/hooks/use-cycle-index';
import {
  AUTOPLAY_SPEED_MAX,
  AUTOPLAY_SPEED_MIN,
  ROTATE_MAX,
  ROTATE_MIN,
  SCENE_HEIGHT_MAX,
  SCENE_HEIGHT_MIN,
  SCENE_WIDTH_MAX,
  SCENE_WIDTH_MIN,
  useViewerPrefs,
} from '@terrafirmagreg-team/ui/hooks/viewer/use-viewer-prefs';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type {
  GlbHomeView,
  GlbOrbitControls,
  GlbSceneHandle,
  GlbSessionProps,
} from '@terrafirmagreg-team/ui/types/glb';

class ErrorBoundary extends Component<
  { children?: ReactNode; onError?: (error: unknown) => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    this.props.onError?.(error);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

const GLB_ZOOM_STEP = 1.3;

export function GlbScene({
  urls,
  title,
  scale,
  offset,
  bare = false,
  resolveResource,
}: {
  urls: string[];
  title?: string;
  scale?: number;
  offset?: number;
  bare?: boolean;
  resolveResource?: (
    resourceUrl: string,
    modelUrl: string,
  ) => string | undefined;
}) {
  const t = useTranslations();
  const {
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
  } = useViewerPrefs();
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useCycleIndex(urls.length, {
    enabled: autoplay,
    paused: hovered,
    intervalMs: autoplaySpeed * 1000,
  });
  const [active, setActive] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<GlbSceneHandle>(null);
  const controlsRef = useRef<GlbOrbitControls>(null);
  const homeRef = useRef<GlbHomeView | null>(null);
  const initializedRef = useRef(false);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const label = title || t('3D model', { note: 'ui.viewer.label' });
  const url = urls[Math.min(selected, urls.length - 1)];
  const [statusEntry, setStatusEntry] = useState<{
    url: string;
    status: 'loading' | 'ready' | 'error';
  }>({ url, status: 'loading' });
  const status = statusEntry.url === url ? statusEntry.status : 'loading';
  const setStatus = useCallback(
    (next: 'loading' | 'ready' | 'error') =>
      setStatusEntry({ url, status: next }),
    [url],
  );

  const handleReady = useCallback(() => setStatus('ready'), [setStatus]);
  const handleError = useCallback(() => setStatus('error'), [setStatus]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          return;
        }
        rendererRef.current?.forceContextLoss();
        rendererRef.current = null;
        initializedRef.current = false;
        setStatus('loading');
        setActive(false);
      },
      { rootMargin: '160px', threshold: 0.01 },
    );
    io.observe(host);
    return () => io.disconnect();
  }, [setStatus]);

  useEffect(() => {
    if (!active || urls.length < 2) return;
    const nextUrl = urls[(selected + 1) % urls.length];
    if (nextUrl)
      useLoader.preload(glbLoaderClass(nextUrl, resolveResource), nextUrl);
  }, [active, selected, urls, resolveResource]);

  const flip = typeof scale === 'number' && scale < 0;
  const multi = urls.length > 1;

  return (
    <div
      ref={surfaceRef}
      className={cn(
        'not-prose overflow-hidden',
        bare
          ? 'relative h-full w-full'
          : 'viewer-surface mx-auto my-3 rounded-xl border border-border',
      )}
      style={bare ? undefined : { width: `${sceneWidth}%` }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div
        className={cn(
          'relative w-full',
          bare ? 'h-full' : 'viewer-scene',
          !bare && dotGrid && 'viewer-dots',
        )}
        style={bare ? undefined : { height: sceneHeight }}
      >
        <div
          ref={hostRef}
          className="absolute inset-0 transition-opacity duration-300"
          style={{ opacity: status === 'ready' ? 1 : 0 }}
        >
          {active ? (
            <Canvas
              flat
              gl={{ antialias: true, alpha: true }}
              dpr={[1, 2]}
              camera={{ fov: 35, position: [4, 3, 6] }}
              role="img"
              aria-label={label}
              onCreated={({ gl }) => {
                rendererRef.current = gl;
              }}
            >
              <ambientLight intensity={0.85} />
              <directionalLight position={[6, 10, 4]} intensity={1.1} />
              <ErrorBoundary key={url} onError={handleError}>
                <Suspense fallback={null}>
                  <GlbModel
                    url={url}
                    flip={flip}
                    scale={scale}
                    offset={offset}
                    controlsRef={controlsRef}
                    homeRef={homeRef}
                    initializedRef={initializedRef}
                    resolveResource={resolveResource}
                    onReady={handleReady}
                  />
                </Suspense>
              </ErrorBoundary>
              <GlbSceneApi
                ref={apiRef}
                controlsRef={controlsRef}
                homeRef={homeRef}
              />
              <OrbitControls
                makeDefault
                enableDamping
                autoRotate={autoRotate}
                autoRotateSpeed={rotateSpeed}
                ref={controlsRef}
              />
            </Canvas>
          ) : null}
        </div>
        {bare ? null : (
        <ViewerToolbar>
          <ViewerControls
            pager={
              multi
                ? { index: selected, count: urls.length, onSelect: setSelected }
                : undefined
            }
            zoom={{
              onZoomIn: () => apiRef.current?.zoomBy(1 / GLB_ZOOM_STEP),
              onZoomOut: () => apiRef.current?.zoomBy(GLB_ZOOM_STEP),
              onFit: () => apiRef.current?.reset(),
              fitLabel: t('Reset view', { note: 'ui.viewer.reset_view' }),
            }}
            expand={{ target: surfaceRef }}
            settings={{
              label: t('Viewer settings', { note: 'ui.viewer.settings' }),
              sliders: [
                {
                  icon: <MoveHorizontal className="size-3.5" />,
                  label: t('Width', { note: 'ui.viewer.width' }),
                  min: SCENE_WIDTH_MIN,
                  max: SCENE_WIDTH_MAX,
                  step: 5,
                  format: (value) => `${value}%`,
                  value: sceneWidth,
                  onChange: setSceneWidth,
                },
                {
                  icon: <MoveVertical className="size-3.5" />,
                  label: t('Height', { note: 'ui.viewer.height' }),
                  min: SCENE_HEIGHT_MIN,
                  max: SCENE_HEIGHT_MAX,
                  step: 16,
                  format: (value) => `${value}px`,
                  value: sceneHeight,
                  onChange: setSceneHeight,
                },
                {
                  icon: <Gauge className="size-3.5" />,
                  label: t('Rotate speed', { note: 'ui.viewer.rotate_speed' }),
                  min: ROTATE_MIN,
                  max: ROTATE_MAX,
                  step: 0.1,
                  format: (value) => `${value.toFixed(1)}×`,
                  value: rotateSpeed,
                  onChange: setRotateSpeed,
                },
                ...(multi
                  ? [
                      {
                        icon: <Timer className="size-3.5" />,
                        label: t('Autoplay speed', { note: 'ui.viewer.autoplay_speed' }),
                        min: AUTOPLAY_SPEED_MIN,
                        max: AUTOPLAY_SPEED_MAX,
                        step: 0.5,
                        disabled: !autoplay,
                        format: (value: number) => `${value.toFixed(1)}s`,
                        value: autoplaySpeed,
                        onChange: setAutoplaySpeed,
                      },
                    ]
                  : []),
              ],
              toggles: [
                {
                  icon: <RotateCw className="size-4" />,
                  label: t('Spin', { note: 'ui.viewer.spin' }),
                  checked: autoRotate,
                  onChange: setAutoRotate,
                },
                ...(multi
                  ? [
                      {
                        icon: <Play className="size-4" />,
                        label: t('Autoplay', { note: 'ui.viewer.autoplay' }),
                        checked: autoplay,
                        onChange: setAutoplay,
                      },
                    ]
                  : []),
                {
                  icon: <Grid3x3 className="size-4" />,
                  label: t('Grid', { note: 'ui.viewer.grid' }),
                  checked: dotGrid,
                  onChange: setDotGrid,
                },
              ],
            }}
          />
        </ViewerToolbar>
        )}
        {status === 'loading' ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            {t('Loading…', { note: 'ui.viewer.loading' })}
          </p>
        ) : status === 'error' ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            {t('Image unavailable', { note: 'ui.image_unavailable' })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function GlbSession({
  src,
  sources,
  title,
  scale,
  offset,
  bare = false,
  resolveResource,
}: GlbSessionProps) {
  const urls = useMemo(
    () => (sources?.length ? sources : src ? [src] : []).filter(Boolean),
    [src, sources],
  );
  if (urls.length === 0) return null;
  return (
    <GlbScene
      key={urls.join('\0')}
      urls={urls}
      title={title}
      scale={scale}
      offset={offset}
      bare={bare}
      resolveResource={resolveResource}
    />
  );
}

