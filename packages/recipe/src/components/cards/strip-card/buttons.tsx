'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useCopyButton } from '@terrafirmagreg-team/ui/hooks/use-copy-button';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { CardPager } from '@terrafirmagreg-team/recipe/components/cards/controls/card-pager';
import { texturePublicUrl } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

const BUTTONS_TEX = 'emi:textures/gui/buttons.png';

export function StripCardTagPager(props: {
  left: number;
  top: number;
  dir: -1 | 1;
  scale: number;
  disabled: boolean;
  onClick: () => void;
  dataset: DatasetRef;
}) {
  const { dataset, ...rest } = props;
  return <CardPager {...rest} tex={texturePublicUrl(dataset, BUTTONS_TEX)} />;
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
      className="absolute flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
          background: done ? 'var(--color-mc-bright)' : hover ? 'var(--color-mc-bright)' : 'var(--color-mc-panel)',
          boxShadow: `inset ${scale}px ${scale}px 0 rgba(255,255,255,0.65), inset -${scale}px -${scale}px 0 rgba(0,0,0,0.45)`,
          color: done ? 'var(--color-mc-done)' : hover ? 'var(--color-mc-arrow-dark)' : 'var(--color-mc-arrow)',
        }}
      >
        <Icon width={7 * scale} height={7 * scale} strokeWidth={2.5} />
      </span>
    </button>
  );
}

