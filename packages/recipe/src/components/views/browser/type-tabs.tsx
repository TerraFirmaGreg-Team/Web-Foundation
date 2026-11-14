'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useMemo } from 'react';
import { Shapes } from 'lucide-react';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { creativeTabName } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
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
  session: Pick<
    RecipeSession,
    'lang' | 'names' | 'index' | 'dataset' | 'langMap'
  >;
  ids: string[];
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
}) {
  const { lang, names, index, dataset, langMap } = session;

  const options = useMemo(() => {
    const byId = new Map(
      (index?.categories ?? []).map((row) => [row.id, row]),
    );
    return ids.map((id) => {
      const category = byId.get(id);
      return {
        id,
        icon: <CategoryGlyph category={category} dataset={dataset} />,
        help: category?.display?.name
          ? creativeTabName(langMap ?? {}, category.display.name)
          : recipeItemName(names, lang, id),
        helpMod:
          index?.mods?.[id.split(':', 2)[0] ?? ''] ?? id.split(':', 2)[0],
      };
    });
  }, [index, ids, lang, names, dataset, langMap]);

  return (
    <IconPager
      value={value}
      options={options}
      onChange={onChange ?? (() => {})}
      className={className}
    />
  );
}

