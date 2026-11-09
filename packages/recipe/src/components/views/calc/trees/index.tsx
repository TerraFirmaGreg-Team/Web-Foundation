'use client';

import { FolderTree, History, Plus } from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import {
  LeftSidebarFolder,
  LeftSidebarFolderContent,
  LeftSidebarFolderTrigger,
} from '@terrafirmagreg-team/ui/components/layouts/left-sidebar';
import type { CalcTreeEntry } from '@terrafirmagreg-team/recipe/lib/calc/storage';
import type { EntryMeta, IconItem } from '@terrafirmagreg-team/recipe/lib/calc/meta';
import { rowClass, rowIdle } from '@terrafirmagreg-team/recipe/lib/calc/meta';
import { HistoryRow, TabRow } from './rows';

export function CalcHistoryList({
  history,
  onOpen,
  meta,
}: {
  history: CalcTreeEntry[];
  onOpen: (entry: CalcTreeEntry) => void;
  meta: EntryMeta;
}) {
  const t = useTranslations();
  if (!history.length) return null;
  return (
    <div className="flex w-64 max-w-full flex-col gap-1">
      <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {t('History', { note: 'recipe.calc.history' })}
      </p>
      <ul className="flex flex-col">
        {history.slice(0, 5).map((entry) => (
          <HistoryRow
            key={entry.id}
            entry={entry}
            onOpen={onOpen}
            meta={meta}
          />
        ))}
      </ul>
    </div>
  );
}

export function CalcTrees({
  tabs,
  activeId,
  history,
  onOpen,
  onOpenEntry,
  onClose,
  onRename,
  onSetIcon,
  onNew,
  onRemoveHistory,
  meta,
}: {
  tabs: CalcTreeEntry[];
  activeId: string | null;
  history: CalcTreeEntry[];
  onOpen: (id: string) => void;
  onOpenEntry: (entry: CalcTreeEntry) => void;
  onClose: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onSetIcon?: (id: string, icon: IconItem) => void;
  onNew: () => void;
  onRemoveHistory: (id: string) => void;
  meta: EntryMeta;
}) {
  const t = useTranslations();
  if (!tabs.length && !history.length) return null;
  return (
    <div className="mb-1 flex flex-col gap-1 border-b border-border pb-2">
      {tabs.length ? (
        <LeftSidebarFolder collapsible defaultOpen>
          <LeftSidebarFolderTrigger className="gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            <FolderTree className="size-3.5" />
            {t('Schemes', { note: 'recipe.calc.trees' })}
          </LeftSidebarFolderTrigger>
          <LeftSidebarFolderContent>
            <ul className="flex max-h-60 flex-col overflow-y-auto">
              {tabs.map((tab) => (
                <TabRow
                  key={tab.id}
                  entry={tab}
                  active={tab.id === activeId}
                  onOpen={onOpen}
                  onClose={onClose}
                  onRename={onRename}
                  onSetIcon={onSetIcon}
                  meta={meta}
                />
              ))}
              <li>
                <button
                  type="button"
                  onClick={onNew}
                  className={`${rowClass} ${rowIdle} w-full`}
                >
                  <Plus className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 text-start">
                    {t('New scheme', { note: 'recipe.calc.new_tab' })}
                  </span>
                </button>
              </li>
            </ul>
          </LeftSidebarFolderContent>
        </LeftSidebarFolder>
      ) : null}
      {history.length ? (
        <LeftSidebarFolder collapsible defaultOpen>
          <LeftSidebarFolderTrigger className="gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            <History className="size-3.5" />
            {t('History', { note: 'recipe.calc.history' })}
          </LeftSidebarFolderTrigger>
          <LeftSidebarFolderContent>
            <ul className="flex flex-col">
              {history.map((entry) => (
                <HistoryRow
                  key={entry.id}
                  entry={entry}
                  onOpen={onOpenEntry}
                  onRemove={onRemoveHistory}
                  meta={meta}
                />
              ))}
            </ul>
          </LeftSidebarFolderContent>
        </LeftSidebarFolder>
      ) : null}
    </div>
  );
}

