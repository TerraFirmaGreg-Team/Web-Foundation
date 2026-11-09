'use client';

import { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import { Input } from '@terrafirmagreg-team/ui/components/ui/input';
import type { CalcTreeEntry } from '@terrafirmagreg-team/recipe/lib/calc/storage';
import type { EntryMeta, IconItem } from '@terrafirmagreg-team/recipe/lib/calc/meta';
import { rowClass, rowIdle } from '@terrafirmagreg-team/recipe/lib/calc/meta';
import { TreeDate, TreeIcon, TreeLabel } from './label';
import { IconPicker } from './icon-picker';

export function TabRow({
  entry,
  active,
  onOpen,
  onClose,
  onRename,
  onSetIcon,
  meta,
}: {
  entry: CalcTreeEntry;
  active: boolean;
  onOpen: (id: string) => void;
  onClose: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onSetIcon?: (id: string, icon: IconItem) => void;
  meta: EntryMeta;
}) {
  const t = useTranslations();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(entry.name ?? '');
  const commit = () => {
    setEditing(false);
    onRename(entry.id, name);
  };
  return (
    <li className="group flex items-center gap-0.5">
      {editing ? (
        <span className="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-0.5">
          <TreeIcon entry={entry} {...meta} />
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit();
              if (event.key === 'Escape') setEditing(false);
            }}
            onBlur={commit}
            className="h-6 px-1.5 text-xs"
            placeholder={t('Rename', { note: 'recipe.calc.rename' })}
          />
          <IconButton label={t('Rename', { note: 'recipe.calc.rename' })} onClick={commit}>
            <Check className="size-3.5" />
          </IconButton>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => onOpen(entry.id)}
          className={`${rowClass} flex-1 ${
            active
              ? 'bg-accent font-medium text-accent-foreground'
              : rowIdle
          }`}
        >
          <TreeIcon entry={entry} {...meta} />
          <TreeLabel entry={entry} {...meta} />
        </button>
      )}
      {!editing && (
        <>
          {meta.iconItems && onSetIcon ? (
            <IconPicker
              items={meta.iconItems}
              meta={meta}
              onPick={(icon) => onSetIcon(entry.id, icon)}
            />
          ) : null}
          <IconButton
            label={t('Rename', { note: 'recipe.calc.rename' })}
            className="opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            onClick={() => {
              setName(entry.name ?? '');
              setEditing(true);
            }}
          >
            <Pencil className="size-3.5" />
          </IconButton>
          <IconButton
            label={t('Close scheme', { note: 'recipe.calc.close_tab' })}
            className="opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            onClick={() => onClose(entry.id)}
          >
            <X className="size-3.5" />
          </IconButton>
        </>
      )}
    </li>
  );
}

export function HistoryRow({
  entry,
  onOpen,
  onRemove,
  meta,
}: {
  entry: CalcTreeEntry;
  onOpen: (entry: CalcTreeEntry) => void;
  onRemove?: (id: string) => void;
  meta: EntryMeta;
}) {
  const t = useTranslations();
  return (
    <li className="group flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => onOpen(entry)}
        className={`${rowClass} ${rowIdle} flex-1`}
      >
        <TreeIcon entry={entry} {...meta} />
        <TreeLabel entry={entry} {...meta} />
        <TreeDate savedAt={entry.savedAt} lang={meta.lang} />
      </button>
      {onRemove && (
        <IconButton
          label={t('Remove from history', { note: 'recipe.calc.remove.history' })}
          className="opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
          onClick={() => onRemove(entry.id)}
        >
          <X className="size-3.5" />
        </IconButton>
      )}
    </li>
  );
}

