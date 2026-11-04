'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useCopyButton } from '@terrafirmagreg-team/ui/hooks/use-copy-button';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';

export function StripCardTagPager({
  left,
  top,
  dir,
  scale,
  disabled,
  onClick,
}: {
  left: number;
  top: number;
  dir: -1 | 1;
  scale: number;
  disabled: boolean;
  onClick: () => void;
}) {
  const t = useTranslations();
  const [hover, setHover] = useState(false);
  const arrow = `${3.5 * scale}px solid ${disabled ? 'var(--color-mc-inset)' : hover ? 'var(--color-mc-arrow-dark)' : 'var(--color-mc-arrow)'}`;
  return (
    <button
      type="button"
      aria-label={
        dir < 0
          ? t('Previous Page', { note: 'ui.prev_page' })
          : t('Next Page', { note: 'ui.next_page' })
      }
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="absolute flex cursor-pointer items-center justify-center border-0 p-0 outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-default"
      style={{
        left,
        top,
        width: 12 * scale,
        height: 12 * scale,
        background: disabled ? 'var(--color-mc-dim)' : hover ? 'var(--color-mc-bright)' : 'var(--color-mc-panel)',
        boxShadow: `inset ${scale}px ${scale}px 0 rgba(255,255,255,0.65), inset -${scale}px -${scale}px 0 rgba(0,0,0,0.45)`,
      }}
    >
      <span
        aria-hidden
        className="block"
        style={{
          width: 0,
          height: 0,
          borderTop: `${2.5 * scale}px solid transparent`,
          borderBottom: `${2.5 * scale}px solid transparent`,
          ...(dir < 0 ? { borderRight: arrow } : { borderLeft: arrow }),
        }}
      />
    </button>
  );
}

export function StripCardTagCopy({
  left,
  top,
  scale,
  value,
}: {
  left: number;
  top: number;
  scale: number;
  value: string;
}) {
  const t = useTranslations();
  const [hover, setHover] = useState(false);
  const { checked: done, onClick } = useCopyButton(() =>
    navigator.clipboard.writeText(value),
  );
  const Icon = done ? Check : Copy;
  return (
    <button
      type="button"
      aria-label={t('Copy recipe id', { note: 'recipe.copy_recipe_id' })}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="absolute flex cursor-pointer items-center justify-center border-0 p-0 outline-none focus-visible:ring-1 focus-visible:ring-ring"
      style={{
        left,
        top,
        width: 12 * scale,
        height: 12 * scale,
        background: done ? 'var(--color-mc-bright)' : hover ? 'var(--color-mc-bright)' : 'var(--color-mc-panel)',
        boxShadow: `inset ${scale}px ${scale}px 0 rgba(255,255,255,0.65), inset -${scale}px -${scale}px 0 rgba(0,0,0,0.45)`,
        color: done ? 'var(--color-mc-done)' : hover ? 'var(--color-mc-arrow-dark)' : 'var(--color-mc-arrow)',
      }}
    >
      <Icon width={7 * scale} height={7 * scale} strokeWidth={2.5} />
    </button>
  );
}

