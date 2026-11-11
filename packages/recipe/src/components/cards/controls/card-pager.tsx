'use client';

import { useState } from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';

export function CardPager({
  left,
  top,
  dir,
  axis = 'horizontal',
  scale,
  disabled,
  onClick,
  tex,
}: {
  left: number;
  top: number;
  dir: -1 | 1;
  axis?: 'horizontal' | 'vertical';
  scale: number;
  disabled: boolean;
  onClick: () => void;
  tex?: string;
}) {
  const t = useTranslations();
  const [hover, setHover] = useState(false);
  const arrow = `${3.5 * scale}px solid ${disabled ? 'var(--color-mc-inset)' : hover ? 'var(--color-mc-arrow-dark)' : 'var(--color-mc-arrow)'}`;
  const vertical = axis === 'vertical';
  return (
    <button
      type="button"
      aria-label={
        dir < 0
          ? t('Previous Page', { note: 'ui.prev_page' })
          : t('Next Page', { note: 'ui.next_page' })
      }
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="absolute flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default"
      style={{
        left: left - 4 * scale,
        top: top - 4 * scale,
        width: 20 * scale,
        height: 20 * scale,
      }}
    >
      <span
        aria-hidden
        className="flex items-center justify-center"
        style={{
          width: 12 * scale,
          height: 12 * scale,
          background: disabled ? 'var(--color-mc-dim)' : hover ? 'var(--color-mc-bright)' : 'var(--color-mc-panel)',
          boxShadow: `inset ${scale}px ${scale}px 0 rgba(255,255,255,0.65), inset -${scale}px -${scale}px 0 rgba(0,0,0,0.45)`,
        }}
      >
        {tex && !vertical ? (
          <span
            aria-hidden
            className="block"
            style={{
              width: 12 * scale,
              height: 12 * scale,
              backgroundImage: `url(${tex})`,
              backgroundSize: `${256 * scale}px ${256 * scale}px`,
              backgroundPosition: `-${(dir < 0 ? 0 : 12) * scale}px -${(disabled ? 24 : hover ? 12 : 0) * scale}px`,
              imageRendering: 'pixelated',
            }}
          />
        ) : (
          <span
          aria-hidden
          className="block"
          style={{
            width: 0,
            height: 0,
            ...(vertical
              ? {
                  borderLeft: `${2.5 * scale}px solid transparent`,
                  borderRight: `${2.5 * scale}px solid transparent`,
                  ...(dir < 0 ? { borderBottom: arrow } : { borderTop: arrow }),
                }
              : {
                  borderTop: `${2.5 * scale}px solid transparent`,
                  borderBottom: `${2.5 * scale}px solid transparent`,
                  ...(dir < 0 ? { borderRight: arrow } : { borderLeft: arrow }),
                }),
          }}
          />
        )}
      </span>
    </button>
  );
}
