'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useMemo, useState } from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@terrafirmagreg-team/ui/components/ui/command';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { stackDisplayName } from '@terrafirmagreg-team/game/lib/entry/display';
import type { RecipeCompactIndex } from '@terrafirmagreg-team/recipe/types';
import type { CalcKind } from '@terrafirmagreg-team/recipe/types/calc';

const PAGE = 80;

export function CalcMaterialPicker({
  open,
  onOpenChange,
  index,
  dataset,
  lang,
  langMap,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  index: RecipeCompactIndex | null;
  dataset: DatasetRef;
  lang: string;
  langMap?: Record<string, string>;
  onSelect: (id: string, kind: CalcKind) => void;
}) {
  const t = useTranslations();
  const [query, setQuery] = useState('');
  const materials = useMemo(() => {
    const fluids = new Set(index?.fluids ?? []);
    const out: { id: string; kind: CalcKind; name: string }[] = [];
    for (const id of index?.usedIds ?? []) {
      if (id.startsWith('#')) continue;
      out.push({
        id,
        kind: fluids.has(id) ? 'fluid' : 'item',
        name: stackDisplayName(langMap, id),
      });
    }
    out.sort((a, b) => a.name.localeCompare(b.name, lang.replace('_', '-')));
    return out;
  }, [index, langMap, lang]);
  const shown = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const hits = terms.length
      ? materials.filter((m) =>
          terms.every(
            (term) =>
              m.id.toLowerCase().includes(term) ||
              m.name.toLowerCase().includes(term),
          ),
        )
      : materials;
    return hits.slice(0, PAGE);
  }, [materials, query]);
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('Add card', { note: 'recipe.calc.add.goal' })}
      description={t('Add card', { note: 'recipe.calc.add.goal' })}
      className="sm:max-w-md"
      commandProps={{ shouldFilter: false }}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t('Search materials', { note: 'recipe.search_materials' })}
      />
      <CommandList>
        <CommandEmpty>
          {t('No results found', { note: 'recipe.search_empty' })}
        </CommandEmpty>
        <CommandGroup>
          {shown.map((mat) => (
            <CommandItem
              key={mat.id}
              value={mat.id}
              onSelect={() => {
                onSelect(mat.id, mat.kind);
                onOpenChange(false);
              }}
            >
              <Entry
                id={mat.id}
                kind={mat.kind}
                dataset={dataset}
                lang={lang}
                langMap={langMap}
                size="sm"
                labeled
                href={false}
                tooltip="adaptive"
              />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
