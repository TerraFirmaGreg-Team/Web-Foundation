'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useMemo } from 'react';
import { Shapes } from 'lucide-react';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import { IconPager } from '@terrafirmagreg-team/ui/components/blocks/page/pager';
import type { RecipeCategory, RecipeSession } from '@terrafirmagreg-team/recipe/types';

function CategoryGlyph({
  category,
  dataset,
}: {
  category?: RecipeCategory;
  dataset: DatasetRef;
}) {
  return category?.icon ? (
    <Entry
      dataset={dataset}
      reference={category.icon}
      name={category.id}
      size="lg"
      href={false}
      tooltip={false}
      missing="hide"
    />
  ) : (
    <Shapes className="size-8" />
  );
}

export function RecipeTypeTabs({
  session,
  ids,
  value,
  onChange,
  className,
}: {
  session: Pick<RecipeSession, 'lang' | 'names' | 'index' | 'dataset'>;
  ids: string[];
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
}) {
  const { lang, names, index, dataset } = session;

  const options = useMemo(() => {
    const byId = new Map(
      (index?.categories ?? []).map((row) => [row.id, row]),
    );
    return ids.map((id) => {
      const category = byId.get(id);
      return {
        id,
        icon: <CategoryGlyph category={category} dataset={dataset} />,
        help: recipeItemName(names, lang, id),
      };
    });
  }, [index, ids, lang, names, dataset]);

  return (
    <IconPager
      value={value}
      options={options}
      onChange={onChange ?? (() => {})}
      className={className}
    />
  );
}

