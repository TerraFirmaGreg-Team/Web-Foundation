'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import { formatCount } from '@terrafirmagreg-team/ui/lib/utils/format';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export const SPRITE_CHIP_CLASS =
  'inline-flex shrink-0 items-center justify-center rounded-sm border border-border bg-secondary p-0.5 hover:bg-accent';

export function SpriteFrame({
  size,
  chip = false,
  badge,
  badgeClassName,
  className,
  style,
  children,
}: {
  size?: number;
  chip?: boolean;
  badge?: ReactNode;
  badgeClassName?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        chip && SPRITE_CHIP_CLASS,
        badge !== undefined && 'relative',
        className,
      )}
      style={{ ...(size ? { width: size, height: size } : undefined), ...style }}
    >
      {children}
      {badge !== undefined ? (
        <span
          className={cn(
            'pointer-events-none absolute -right-0.5 -bottom-0.5 z-10',
            badgeClassName,
          )}
        >
          {badge}
        </span>
      ) : null}
    </span>
  );
}

export function Sprite({
  src,
  rect,
  page,
  size,
  tint,
  alt = '',
  className,
  fallback,
  onError,
}: {
  src?: string;

  rect?: { x: number; y: number; w: number };

  page?: { w: number; h: number };
  size: number;
  tint?: string;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
  onError?: () => void;
}) {
  if (!src) {
    return (
      fallback ?? (
        <Skeleton
          className={cn('inline-block shrink-0', className)}
          style={{ width: size, height: size }}
        />
      )
    );
  }
  if (rect && page) {
    const scale = size / Math.max(rect.w, 1);
    const pos = `-${rect.x * scale}px -${rect.y * scale}px`;
    const bgSize = `${page.w * scale}px ${page.h * scale}px`;
    return (
      <span
        className={className ?? 'relative inline-block shrink-0'}
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${src})`,
          backgroundPosition: pos,
          backgroundSize: bgSize,
          imageRendering: 'pixelated',
          ...(tint
            ? {
                backgroundColor: tint,
                backgroundBlendMode: 'multiply',
                WebkitMaskImage: `url(${src})`,
                maskImage: `url(${src})`,
                WebkitMaskPosition: pos,
                maskPosition: pos,
                WebkitMaskSize: bgSize,
                maskSize: bgSize,
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }
            : {}),
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-sm', className)}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      loading="lazy"
      decoding="async"
      onError={onError}
    />
  );
}

export const SPRITE_CLUSTER_UNITS = 18;
export const SPRITE_CLUSTER_INSET = 6;
const CLUSTER_BLEED = 1.15;
const CLUSTER_POSITIONS: readonly (readonly [number, number])[][] = [
  [],
  [[1.6, 1.6]],
  [
    [0.4, 0.8],
    [2.8, 2.4],
  ],
  [
    [-0.8, 0],
    [1.6, 1.6],
    [4.0, 3.2],
  ],
];

export function SpriteCluster({
  items,
  size = 36,
  chip = true,
  inset = SPRITE_CLUSTER_INSET,
  limit = 3,
}: {
  items: ReactNode[];
  size?: number;
  chip?: boolean;
  inset?: number;
  limit?: number;
}) {
  const inner = size - (chip ? inset : 0);
  const scale = inner / SPRITE_CLUSTER_UNITS;
  const shown = items.slice(0, Math.min(limit, CLUSTER_POSITIONS.length - 1));
  const positions = CLUSTER_POSITIONS[shown.length];
  return (
    <SpriteFrame size={size} chip={chip}>
      <span className="relative block" style={{ width: inner, height: inner }}>
        {shown.map((node, i) => (
          <span
            key={i}
            className="absolute"
            style={{
              left: positions[i][0] * CLUSTER_BLEED * scale,
              top: positions[i][1] * CLUSTER_BLEED * scale,
              zIndex: shown.length - i,
            }}
          >
            {node}
          </span>
        ))}
      </span>
    </SpriteFrame>
  );
}

export function SpriteCount({
  count,
  limit,
  className,
  style,
}: {
  count: number;
  limit?: number;
  className?: string;
  style?: CSSProperties;
}) {
  if (count < 1) return null;
  return (
    <span aria-hidden className={className} style={style}>
      {formatCount(count, limit)}
    </span>
  );
}

export function SpriteList({
  items,
  variant = 'grid',
  className,
}: {
  items: { key: React.Key; node: ReactNode }[];
  variant?: 'grid' | 'row';
  className?: string;
}) {
  return (
    <ul
      className={cn(
        variant === 'grid'
          ? 'grid grid-cols-[repeat(auto-fill,minmax(--spacing(9),1fr))] gap-1'
          : 'flex flex-wrap items-center gap-3',
        className,
      )}
    >
      {items.map((item) => (
        <li key={item.key}>{item.node}</li>
      ))}
    </ul>
  );
}
