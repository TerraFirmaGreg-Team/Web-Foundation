'use client';

import { usePathname } from 'next/navigation';
import { Anvil, Calculator, FlaskConical, Shapes } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import { recipePlaceFromParams } from '@terrafirmagreg-team/recipe/lib/links';
import { recipeCalcHref, recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import { parseSectionLocation } from '@terrafirmagreg-team/sites/location';
import { Switcher } from '@terrafirmagreg-team/ui/components/blocks/nav/switcher';
import {
  isDatasetFailed,
  useFailedDatasets,
} from '@terrafirmagreg-team/kit/hooks/use-dump-status';
import { useVersionedDataset } from '@terrafirmagreg-team/kit/hooks/use-versioned-dataset';
import { useSectionCatalog } from '@terrafirmagreg-team/kit/hooks/use-catalog';

export function RecipeAxisSwitcher() {
  const t = useTranslations();
  const { dataset: datasetId } = parseSectionLocation(usePathname());
  const lang = useResolvedLang();
  const params = useLocationSearchParams();
  const axis = recipePlaceFromParams(params).kind;
  const failed = useFailedDatasets();
  const catalog = useSectionCatalog();
  const meta = catalog.recipe?.find(({ id }) => id === datasetId);
  const dataset = useVersionedDataset(datasetId, meta);
  if (!datasetId || !dataset || isDatasetFailed(failed, dataset)) return null;
  return (
    <Switcher
      options={[
        {
          value: 'type',
          title: t('Categories', { note: 'recipe.axis_type' }),
          icon: <Shapes className="size-4" />,
          url: recipeHref(dataset, lang),
        },
        {
          value: 'calc',
          title: t('Calculator', { note: 'recipe.calculator' }),
          icon: <Calculator className="size-4" />,
          url: recipeCalcHref(dataset, lang),
        },
        {
          value: 'forge',
          title: t('Forging', { note: 'recipe.forge.title' }),
          icon: <Anvil className="size-4" />,
          url: recipeHref(dataset, lang, { tool: 'forge' }),
        },
        {
          value: 'alloy',
          title: t('Alloys', { note: 'recipe.alloy.title' }),
          icon: <FlaskConical className="size-4" />,
          url: recipeHref(dataset, lang, { tool: 'alloy' }),
        },
      ]}
      selected={axis ?? 'type'}
      placeholder={t('Categories', { note: 'recipe.axis_type' })}
    />
  );
}

