'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { useEffect, useMemo, useRef } from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { TreeContextProvider } from '@terrafirmagreg-team/ui/components/layouts/tree-context';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import {
  LeftSidebarItem,
  LeftSidebarTree,
} from '@terrafirmagreg-team/ui/components/layouts/left-sidebar';
import { recipeStackHref } from '@terrafirmagreg-team/recipe/lib/links';
import { formatCount } from '@terrafirmagreg-team/ui/lib/utils/format';
import { CalcTrees } from '@terrafirmagreg-team/recipe/components/views/calc/trees';
import type { CalcMaterial } from '@terrafirmagreg-team/recipe/types/calc';
import type { CalcTreeEntry } from '@terrafirmagreg-team/recipe/lib/calc/storage';

export function CalcSidebar({
  dataset,
  lang,
  langMap,
  summary,
  onFocus,
  trees,
  version,
}: {
  dataset: DatasetRef;
  lang: string;
  version?: string;
  langMap?: Record<string, string>;
  summary: {
    raw: CalcMaterial[];
    remainders: CalcMaterial[];
    catalysts: CalcMaterial[];
    products: CalcMaterial[];
  };
  onFocus?: (id: string) => void;
  trees?: {
    tabs: CalcTreeEntry[];
    activeId: string | null;
    history: CalcTreeEntry[];
    iconItems?: { id: string; kind: 'item' | 'fluid' }[];
    onOpen: (id: string) => void;
    onOpenEntry: (entry: CalcTreeEntry) => void;
    onClose: (id: string) => void;
    onRename: (id: string, name: string) => void;
    onSetIcon: (id: string, icon: { id: string; kind: 'item' | 'fluid' }) => void;
    onNew: () => void;
    onRemoveHistory: (id: string) => void;
  };
}) {
  const t = useTranslations();
  const { tree, focusByUrl } = useMemo(() => {
    const focusByUrl = new Map<string, string>();
    const children: PageTree.Node[] = [];
    const sections = [
      ['inputs', summary.raw, t('Inputs', { note: 'recipe.calc.inputs' })],
      [
        'outputs',
        [...summary.products, ...summary.remainders],
        t('Outputs', { note: 'recipe.calc.outputs' }),
      ],
      [
        'catalysts',
        summary.catalysts,
        t('Catalysts', { note: 'recipe.calc.catalysts' }),
      ],
    ] as const;
    for (const [key, rows, label] of sections) {
      if (!rows.length) continue;
      children.push({
        type: 'folder',
        $id: `calc-${key}`,
        name: (
          <span className="-me-3 flex min-w-0 flex-1 items-center gap-1.5">
            <span className="truncate">{label}</span>
            <span className="shrink-0 tabular-nums text-xs text-muted-foreground/70">
              ×{rows.length}
            </span>
          </span>
        ),
        defaultOpen: true,
        children: rows.map((row): PageTree.Item => {
          const url = recipeStackHref(dataset, lang, row.id, {
            kind: row.kind,
            version,
          });
          focusByUrl.set(url, row.id);
          return {
            type: 'page',
            $id: url,
            url,
            name: (
              <>
                <Entry
                  id={row.id}
                  kind={row.kind}
                  dataset={dataset}
                  lang={lang}
                  langMap={langMap}
                  size="sm"
                  labeled
                  href={false}
                  tooltip={false}
                  className="min-w-0 flex-1 justify-start truncate"
                />
                <span
                  className="ms-auto shrink-0 tabular-nums text-xs text-muted-foreground"
                  title={row.amount.toLocaleString()}
                >
                  ×{formatCount(row.amount)}
                </span>
              </>
            ),
          };
        }),
      });
    }
    const stamp = sections
      .flatMap(([key, rows]) =>
        rows.map((row) => `${key}:${row.id}:${row.amount}`),
      )
      .join();
    return {
      tree: { name: 'calc', $id: `calc:${stamp}`, children } as PageTree.Root,
      focusByUrl,
    };
  }, [dataset, lang, langMap, summary, t, version]);

  const CalcItem = useMemo(() => {
    const focus = focusByUrl;
    const handle = onFocus;
    return function CalcItem({ item }: { item: PageTree.Node }) {
      if (item.type !== 'page') return null;
      return (
        <LeftSidebarItem
          href={item.url}
          icon={item.icon}
          onClick={(event) => {
            if (event.ctrlKey || event.metaKey || event.shiftKey) return;
            event.preventDefault();
            const id = focus.get(item.url);
            if (id) handle?.(id);
          }}
        >
          {item.name}
        </LeftSidebarItem>
      );
    };
  }, [focusByUrl, onFocus]);

  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    rootRef.current
      ?.closest('[data-slot=left-sidebar-viewport]')
      ?.scrollTo({ top: 0 });
  }, []);

  return (
    <div ref={rootRef} className="pb-2">
      {trees && (
        <CalcTrees
          {...trees}
          meta={{ dataset, lang, langMap, iconItems: trees.iconItems }}
        />
      )}
      <TreeContextProvider tree={tree}>
        <LeftSidebarTree Item={CalcItem} />
      </TreeContextProvider>
    </div>
  );
}

