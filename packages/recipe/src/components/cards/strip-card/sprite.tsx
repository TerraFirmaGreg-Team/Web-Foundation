'use client';

import type { CSSProperties } from 'react';

export function StripCardSprite({
  src,
  pos,
  width,
  height,
  className,
  style,
}: {
  src: string;

  pos: string;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {}),
        backgroundImage: `url(${src})`,
        backgroundPosition: pos,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        ...style,
      }}
    />
  );
}

