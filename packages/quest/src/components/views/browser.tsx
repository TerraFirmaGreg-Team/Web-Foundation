'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import { X } from 'lucide-react';
import { questConfig } from '@terrafirmagreg-team/quest/lib/config';
import {
  useAsyncResult,
  useAsyncValue,
} from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useLastResult } from '@terrafirmagreg-team/ui/hooks/use-last-result';
import { useVersionedDataset } from '@terrafirmagreg-team/kit/hooks/use-versioned-dataset';
import { useDumpRetryNonce } from '@terrafirmagreg-team/kit/hooks/use-dump-status';
import { DumpUnavailable } from '@terrafirmagreg-team/kit/components/views/unavailable';
import { StaleBadge } from '@terrafirmagreg-team/kit/components/dump-status/stale-badge';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useDocumentTitle } from '@terrafirmagreg-team/ui/hooks/use-document-title';
import {
  DEFAULT_GRID_SCALE,
  DEFAULT_QUEST_SPACING,
} from '@terrafirmagreg-team/quest/lib/grid';
import { questHref } from '@terrafirmagreg-team/quest/lib/links';
import { questFromCompact } from '@terrafirmagreg-team/quest/lib/data/parse';
import { chapterEntryQuestId } from '@terrafirmagreg-team/quest/lib/data/entry';
import { groupQuestChapters } from '@terrafirmagreg-team/quest/lib/data/groups';
import { getQuestSource } from '@terrafirmagreg-team/quest/lib/source';
import { questDisplayTitle } from '@terrafirmagreg-team/quest/lib/display';
import { plainQuestText } from '@terrafirmagreg-team/quest/lib/rich-text';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import { EmptyState } from '@terrafirmagreg-team/ui/components/blocks/page/empty-state';
import { EntryProvider } from '@terrafirmagreg-team/game/hooks/use-entry-context';
import {
  RightSidebarPanel,
  RightSidebarPortal,
} from '@terrafirmagreg-team/ui/components/layouts/right-sidebar';
import { CanvasFlow } from '@terrafirmagreg-team/quest/components/views/canvas/flow';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import { SearchOverlay } from '@terrafirmagreg-team/quest/components/views/search-overlay';
import { QuestView } from '@terrafirmagreg-team/quest/components/views/view';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

const QUEST_SKELETON_NODES = [
  { x: '12%', y: '18%' },
  { x: '30%', y: '12%' },
  { x: '48%', y: '22%' },
  { x: '68%', y: '14%' },
  { x: '22%', y: '44%' },
  { x: '42%', y: '52%' },
  { x: '62%', y: '40%' },
  { x: '80%', y: '56%' },
  { x: '16%', y: '72%' },
  { x: '38%', y: '80%' },
  { x: '60%', y: '70%' },
  { x: '78%', y: '82%' },
];

const QUEST_SKELETON_EDGES = [
  { x: '18%', y: '20%', w: '14%' },
  { x: '36%', y: '19%', w: '16%' },
  { x: '55%', y: '20%', w: '14%' },
  { x: '28%', y: '48%', w: '12%' },
  { x: '50%', y: '50%', w: '14%' },
  { x: '24%', y: '76%', w: '12%' },
  { x: '48%', y: '78%', w: '14%' },
];

function QuestPanelSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3 p-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="mt-2 h-24 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function QuestBrowserFallback() {
  return (
    <div aria-hidden className="viewport-body relative min-h-0 flex-1 overflow-hidden">
      {QUEST_SKELETON_NODES.map((node, i) => (
        <Skeleton
          key={i}
          className="absolute size-10 rounded-sm"
          style={{ left: node.x, top: node.y }}
        />
      ))}
      {QUEST_SKELETON_EDGES.map((edge, i) => (
        <Skeleton
          key={`e${i}`}
          className="absolute h-px -translate-y-1/2 rotate-45 opacity-60"
          style={{ left: edge.x, top: edge.y, width: edge.w }}
        />
      ))}
      <RightSidebarPortal>
        <RightSidebarPanel>
          <QuestPanelSkeleton />
        </RightSidebarPanel>
      </RightSidebarPortal>
    </div>
  );
}

export function QuestBrowser({
  dataset: id,
  datasetTitle,
  lang,
  versions,
}: {
  dataset: string;
  datasetTitle: string;
  lang: Lang;
  versions?: readonly string[];
}) {
  const router = useRouter();
  const t = useTranslations();
  const params = useLocationSearchParams();
  const dataset = useVersionedDataset(id, { versions }) ?? { id };
  const category = params.get('category') ?? undefined;
  const selectedId = params.get('id') ?? undefined;
  const item = params.get('item') ?? undefined;
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const source = getQuestSource();
  const nonce = useDumpRetryNonce();
  const index = useLastResult(
    useAsyncResult(
      () => source.index(dataset, lang),
      [dataset, lang, nonce],
    ),
    dataset.id,
  );
  const langMap =
    useAsyncValue(
      () => source.langMap(dataset, lang),
      [dataset, lang, nonce],
    ) ?? {};

  const row = useMemo(() => {
    if (!index.value) return undefined;
    const all = groupQuestChapters(index.value).flatMap(
      (group) => group.chapters,
    );
    return all.find((chapter) => chapter.filename === category) ?? all[0];
  }, [index.value, category]);

  const resolved = useResolvedLang();
  useEffect(() => {
    if (!row || row.filename === category) return;
    router.replace(
      questHref(dataset, resolved, {
        category: row.filename,
        id: selectedId,
        item,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- params change per render
  }, [row?.filename, category, dataset, resolved]);

  const chapter = useLastResult(
    useAsyncResult(
      row
        ? () =>
            source.chapter(dataset, row, index.value?.book?.defaultQuestShape)
        : undefined,
      [dataset, row?.file, index.value, nonce],
    ),
    `${dataset.id}:${row?.filename ?? ''}`,
  );

  const autoOpenedRef = useRef<string | null>(null);
  const prevChapterRef = useRef<string>(undefined);
  useEffect(() => {
    const current = chapter.value;
    if (!current) return;
    const filename = current.filename;
    if (prevChapterRef.current === filename) return;
    prevChapterRef.current = filename;
    autoOpenedRef.current = null;
    if (selectedId) return;
    const entryId = chapterEntryQuestId(current);
    if (!entryId) return;
    autoOpenedRef.current = entryId;
    router.replace(
      questHref(dataset, resolved, {
        category: filename,
        id: entryId,
        item,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- params change per render
  }, [chapter.value, selectedId, dataset, resolved]);

  const chapterTitle = chapter.value
    ? plainQuestText(chapter.value.title ?? chapter.value.filename, langMap)
    : (row && plainQuestText(row.title, langMap)) || row?.filename || '';

  const local = chapter.value?.quests.find((quest) => quest.id === selectedId);
  const linked = index.value?.quests.find((entry) => entry.id === selectedId);
  const selected = local ?? (linked ? questFromCompact(linked) : undefined);
  const linkTarget =
    !local && linked && chapter.value && linked.filename !== chapter.value.filename
      ? linked
      : undefined;
  const linkTargetTitle = linkTarget
    ? (plainQuestText(
        index.value?.chapters.find((row) => row.filename === linkTarget.filename)
          ?.title ?? linkTarget.filename,
        langMap,
      ) || linkTarget.filename)
    : undefined;

  useDocumentTitle(
    selected
      ? `${questDisplayTitle(selected, langMap)} · ${chapterTitle} · ${datasetTitle} | ${questConfig().appName}`
      : `${chapterTitle || datasetTitle} · ${datasetTitle} | ${questConfig().appName}`,
  );

  const replaceQuest = (opts?: { category?: string; id?: string }) => {
    router.replace(
      questHref(dataset, resolved, {
        category: opts?.category ?? row?.filename,
        id: opts?.id,
        item,
      }),
    );
  };

  const questPanel = selected ? (
    <QuestView
      quest={selected}
      dataset={dataset}
      lang={lang}
      langMap={langMap}
      index={index.value}
      chapterJump={
        linkTarget
          ? { filename: linkTarget.filename, title: linkTargetTitle }
          : undefined
      }
    />
  ) : index.pending || chapter.pending ? (
    <QuestPanelSkeleton />
  ) : (
    <div className="p-4">
      <EmptyState variant="missing">
        {t('Quest not found', { note: 'quest.not_found' })}
      </EmptyState>
    </div>
  );

  return (
    <EntryProvider dataset={dataset} lang={lang} langMap={langMap}>
      <div className="viewport-shell quest-viewport relative">
        {index.stale || chapter.stale ? <StaleBadge /> : null}
        {index.error || (!index.pending && !index.value) ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <DumpUnavailable>
              {t('Quest data is temporarily unavailable. Try again later.', {
                note: 'quest.unavailable',
              })}
            </DumpUnavailable>
          </div>
        ) : chapter.value && chapter.value.filename === row?.filename ? (
          <CanvasFlow
            chapter={chapter.value}
            dataset={dataset}
            langMap={langMap}
            gridScale={index.value?.book?.gridScale ?? DEFAULT_GRID_SCALE}
            questSpacing={
              index.value?.book?.questSpacing ?? DEFAULT_QUEST_SPACING
            }
            index={index.value ?? null}
            selectedId={selectedId ?? null}
            suppressPanRef={autoOpenedRef}
            onSelectQuest={(id, filename, kind) => {
              autoOpenedRef.current = null;
              replaceQuest({
                category:
                  kind === 'link' ? row?.filename : filename || row?.filename,
                id,
              });
            }}
            onClearSelection={() => replaceQuest({ category: row?.filename })}
            onOpenSearch={() => setSearchOpen(true)}
          />
        ) : chapter.error || (!chapter.pending && !chapter.value && row) ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <DumpUnavailable>
              {t('Quest data is temporarily unavailable. Try again later.', {
                note: 'quest.unavailable',
              })}
            </DumpUnavailable>
          </div>
        ) : (
          <div aria-hidden className="absolute inset-0 overflow-hidden">
            {QUEST_SKELETON_NODES.map((node, i) => (
              <Skeleton
                key={i}
                className="absolute size-10 rounded-sm"
                style={{ left: node.x, top: node.y }}
              />
            ))}
            {QUEST_SKELETON_EDGES.map((edge, i) => (
              <Skeleton
                key={`e${i}`}
                className="absolute h-px -translate-y-1/2 rotate-45 opacity-60"
                style={{ left: edge.x, top: edge.y, width: edge.w }}
              />
            ))}
          </div>
        )}
        <RightSidebarPortal>
          <RightSidebarPanel>
            {selectedId ? (
              questPanel
            ) : (
              <div className="p-4">
                <EmptyState>
                  {t('Select a quest to view its details.', {
                    note: 'quest.select_hint',
                  })}
                </EmptyState>
              </div>
            )}
          </RightSidebarPanel>
        </RightSidebarPortal>
        {selectedId ? (
          <aside className="absolute inset-y-0 right-0 z-20 w-full max-w-md border-l border-border bg-background shadow-lg lg:hidden ps-4">
            <IconButton
              variant="ghost"
              size="icon-sm"
              label={t('Close', { note: 'quest.close' })}
              onClick={() => replaceQuest({ category: row?.filename })}
              className="absolute right-2 top-2 z-10"
            >
              <X className="size-4" />
            </IconButton>
            {questPanel}
          </aside>
        ) : null}
        <SearchOverlay
          open={searchOpen}
          query={query}
          onQuery={setQuery}
          onClose={() => {
            setSearchOpen(false);
            setQuery('');
          }}
          dataset={dataset}
          langMap={langMap}
          index={index.value ?? null}
        />
      </div>
    </EntryProvider>
  );
}

