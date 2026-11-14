'use client';

import { Check, CircleAlert, LoaderCircle, Share2, Trash2 } from 'lucide-react';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { RecipeToolbar } from '@terrafirmagreg-team/recipe/components/views/browser/toolbar';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';
import { CalcHelp } from './help';
import { useFeatureFlags } from '@terrafirmagreg-team/kit/hooks/use-features';

export function CalcActions({
  session,
  shared,
  sharing,
  shareError,
  shareFailed,
  onShare,
  hasTargets,
  onClear,
}: {
  session: RecipeSession;
  shared: boolean;
  sharing?: boolean;
  shareError?: boolean;
  shareFailed?: boolean;
  onShare: () => void;
  hasTargets: boolean;
  onClear: () => void;
}) {
  const t = useTranslations();
  const flags = useFeatureFlags();
  return (
    <>
      <RecipeToolbar session={session} />
      {shareFailed ? (
        <IconButton
          overlay
          className="text-red-500"
          label={t('Shared scheme failed to load', { note: 'recipe.calc.share_failed' })}
        >
          <CircleAlert className="size-3.5" />
        </IconButton>
      ) : null}
      <IconButton
        overlay
        disabled={flags?.share === false || sharing}
        className={shareError ? 'text-red-500' : undefined}
        label={
          shared
            ? t('Copied', { note: 'recipe.copied' })
            : shareError
              ? t('Copy failed', { note: 'recipe.calc.copy_failed' })
              : t('Share', { note: 'recipe.calc.share' })
        }
        onClick={onShare}
      >
        {sharing ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : shared ? (
          <Check className="size-3.5" />
        ) : shareError ? (
          <CircleAlert className="size-3.5" />
        ) : (
          <Share2 className="size-3.5" />
        )}
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
