'use client';

import { Share2, Trash2 } from 'lucide-react';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { RecipeToolbar } from '@terrafirmagreg-team/recipe/components/views/browser/toolbar';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';
import { CalcHelp } from './help';

export function CalcActions({
  session,
  shared,
  onShare,
  hasTargets,
  onClear,
}: {
  session: RecipeSession;
  shared: boolean;
  onShare: () => void;
  hasTargets: boolean;
  onClear: () => void;
}) {
  const t = useTranslations();
  return (
    <>
      <RecipeToolbar session={session} />
      <IconButton
        overlay
        label={shared ? t('Copied', { note: 'recipe.copied' }) : t('Share', { note: 'recipe.calc.share' })}
        onClick={onShare}
      >
        <Share2 className="size-3.5" />
      </IconButton>
      <CalcHelp />
      {hasTargets ? (
        <IconButton
          overlay
          label={t('Clear', { note: 'recipe.calc.clear.title' })}
          onClick={onClear}
        >
          <Trash2 className="size-3.5" />
        </IconButton>
      ) : null}
    </>
  );
}

