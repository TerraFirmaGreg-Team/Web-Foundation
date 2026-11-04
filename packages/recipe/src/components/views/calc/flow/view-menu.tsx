'use client';

import {
  GalleryHorizontal,
  LayoutGrid,
  RectangleHorizontal,
  Settings2,
} from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@terrafirmagreg-team/ui/components/ui/dropdown-menu';
import type {
  CalcFarMode,
  CalcViewMode,
} from '@terrafirmagreg-team/recipe/lib/calc/flow';

const MODE_ICONS = {
  mini: LayoutGrid,
  normal: RectangleHorizontal,
  detailed: GalleryHorizontal,
} as const;

const FAR_MODES: CalcFarMode[] = ['full', 'preview', 'hidden'];

export function CalcViewMenu({
  mode,
  onModeChange,
  farCards,
  onFarCardsChange,
}: {
  mode: CalcViewMode;
  onModeChange: (mode: CalcViewMode) => void;
  farCards: CalcFarMode;
  onFarCardsChange: (mode: CalcFarMode) => void;
}) {
  const t = useTranslations();
  const modeLabels: Record<CalcViewMode, string> = {
    mini: t('Compact view', { note: 'recipe.calc.mode.mini' }),
    normal: t('Card view', { note: 'recipe.calc.mode.normal' }),
    detailed: t('Recipe view', { note: 'recipe.calc.mode.detailed' }),
  };
  const farLabels: Record<CalcFarMode, string> = {
    full: t('Full card', { note: 'recipe.calc.far.full' }),
    preview: t('Preview', { note: 'recipe.calc.far.preview' }),
    hidden: t('Hide', { note: 'recipe.calc.far.hidden' }),
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<IconButton overlay label={t('View settings', { note: 'recipe.calc.view.title' })} />}
      >
        <Settings2 className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="start"
        className="w-fit min-w-48"
      >
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(value) => onModeChange(value as CalcViewMode)}
        >
          <DropdownMenuLabel className="whitespace-nowrap">
            {t('Cards', { note: 'recipe.calc.view.modes' })}
          </DropdownMenuLabel>
          {(Object.keys(MODE_ICONS) as CalcViewMode[]).map((value) => {
            const ModeIcon = MODE_ICONS[value];
            return (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                className="whitespace-nowrap"
              >
                <ModeIcon className="size-4" />
                {modeLabels[value]}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
        {mode === 'detailed' ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={farCards}
              onValueChange={(value) =>
                onFarCardsChange(value as CalcFarMode)
              }
            >
              <DropdownMenuLabel className="whitespace-nowrap">
                {t('Cards when zoomed out', { note: 'recipe.calc.far.title' })}
              </DropdownMenuLabel>
              {FAR_MODES.map((value) => (
                <DropdownMenuRadioItem
                  key={value}
                  value={value}
                  className="whitespace-nowrap"
                >
                  {farLabels[value]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

