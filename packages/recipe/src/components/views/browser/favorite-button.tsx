'use client';

import { Star } from 'lucide-react';
import { Toggle } from '@terrafirmagreg-team/ui/components/ui/toggle';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function FavoriteButton({
  active,
  onToggle,
  label,
  variant = 'ghost',
  className,
}: {
  active: boolean;
  onToggle: () => void;
  label?: string;
  variant?: 'ghost' | 'outline' | 'overlay';
  className?: string;
}) {
  const t = useTranslations();
  const text =
    label ??
    (active ? t('Remove from favorites', { note: 'recipe.remove_favorite' }) : t('Add to favorites', { note: 'recipe.add_favorite' }));
  return (
    <Hint label={text}>
      <Toggle
        variant={variant === 'outline' ? 'outline' : 'default'}
        pressed={active}
        onPressedChange={onToggle}
        aria-label={text}
        className={cn(
          'size-7 rounded-lg p-0 data-pressed:bg-transparent [&_svg]:size-3.5',
          variant === 'overlay' &&
            'absolute bottom-1 right-1 z-10 size-6 rounded-sm bg-background/80',
          active && 'text-amber-500',
          className,
        )}
      >
        <Star className={cn(active && 'fill-current')} />
      </Toggle>
    </Hint>
  );
}

