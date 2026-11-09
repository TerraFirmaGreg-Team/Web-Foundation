'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Shapes } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import { Input } from '@terrafirmagreg-team/ui/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@terrafirmagreg-team/ui/components/ui/popover';
import type { EntryMeta, IconItem } from '@terrafirmagreg-team/recipe/lib/calc/meta';

export function IconPicker({
  items,
  onPick,
  meta,
  label,
  icon,
  alwaysVisible,
}: {
  items: IconItem[];
  onPick: (icon: IconItem) => void;
  meta: EntryMeta;
  label?: string;
  icon?: ReactNode;
  alwaysVisible?: boolean;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? items.filter(
          (item) =>
            item.id.toLowerCase().includes(q) ||
            meta.langMap?.[item.id]?.toLowerCase().includes(q),
        )
      : items;
    return list.slice(0, 60);
  }, [items, query, meta.langMap]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <IconButton
            label={label ?? t('Pick icon', { note: 'recipe.calc.pick.icon' })}
            className={
              alwaysVisible
                ? undefined
                : 'opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100'
            }
          />
        }
      >
        {icon ?? <Shapes className="size-3.5" />}
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-[min(18rem,calc(100vw-2rem))] p-2"
      >
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('Search items', { note: 'recipe.search' })}
          className="h-7 px-2 text-xs"
        />
        <div className="mt-2 grid max-h-60 grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1 overflow-x-clip overflow-y-auto">
          {results.map((item) => (
            <button
              key={`${item.kind}:${item.id}`}
              type="button"
              className="flex items-center justify-center rounded p-1 hover:bg-accent"
              onClick={() => {
                onPick(item);
                setOpen(false);
              }}
            >
              <Entry
                id={item.id}
                kind={item.kind}
                dataset={meta.dataset}
                lang={meta.lang}
                langMap={meta.langMap}
                size="sm"
                href={false}
                tooltip={false}
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

