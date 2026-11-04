'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocationSearchParams } from '@terrafirmagreg-team/ui/hooks/page/use-location-search';
import { X } from 'lucide-react';
import { questConfig } from '@terrafirmagreg-team/quest/lib/config';
import { useAsyncValue } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import { useVersionedDataset } from '@terrafirmagreg-team/kit/hooks/use-versioned-dataset';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useDocumentTitle } from '@terrafirmagreg-team/ui/hooks/use-document-title';
import {
  DEFAULT_GRID_SCALE,
  DEFAULT_QUEST_SPACING,
} from '@terrafirmagreg-team/quest/lib/grid';
import { questHref } from '@terrafirmagreg-team/quest/lib/links';
import { questFromCompact } from '@terrafirmagreg-team/quest/lib/data/parse';
import { chapterEntryQuestId } from '@terrafirmagreg-team/quest/lib/data/entry';
import { groupQuestChapters } from '@terrafirmagreg-team/quest/lib/data/groups';
import {
  loadQuestChapter,
  loadQuestCompactIndex,
  loadQuestLangMap,
} from '@terrafirmagreg-team/quest/lib/client/quest';
import { questDisplayTitle } from '@terrafirmagreg-team/quest/lib/display';
import { plainQuestText } from '@terrafirmagreg-team/quest/lib/rich-text';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
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

  const index = useAsyncValue(
    () => loadQuestCompactIndex(dataset, lang),
    [dataset, lang],
  );
  const langMap =
    useAsyncValue(() => loadQuestLangMap(dataset, lang), [dataset, lang]) ?? {};

  const row = useMemo(() => {
    if (!index) return undefined;
    const all = groupQuestChapters(index).flatMap(
      (group) => group.chapters,
    );
    return all.find((chapter) => chapter.filename === category) ?? all[0];
  }, [index, category]);

  useEffect(() => {
    if (!row || row.filename === category) return;
    router.replace(
      questHref(dataset, lang, {
        category: row.filename,
        id: selectedId,
        item,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- params change per render
  }, [row?.filename, category, dataset, lang]);

  const chapter = useAsyncValue(
    () => loadQuestChapter(dataset, row, index?.book?.defaultQuestShape),
    [dataset, row?.file, index],
  );

  const autoOpenedRef = useRef<string | null>(null);
  const prevChapterRef = useRef<string>(undefined);
  useEffect(() => {
    const filename = chapter?.filename;
    if (!filename) return;
    if (prevChapterRef.current === filename) return;
    prevChapterRef.current = filename;
    autoOpenedRef.current = null;
    if (selectedId) return;
    const entryId = chapterEntryQuestId(chapter);
    if (!entryId) return;
    autoOpenedRef.current = entryId;
    router.replace(
      questHref(dataset, lang, {
        category: filename,
        id: entryId,
        item,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- params change per render
  }, [chapter, selectedId, dataset, lang]);

  const chapterTitle = chapter
    ? plainQuestText(chapter.title ?? chapter.filename, langMap)
    : (row && plainQuestText(row.title, langMap)) || row?.filename || '';

  const local = chapter?.quests.find((quest) => quest.id === selectedId);
  const linked = index?.quests.find((entry) => entry.id === selectedId);
  const selected = local ?? (linked ? questFromCompact(linked) : undefined);
  const linkTarget =
    !local && linked && chapter && linked.filename !== chapter.filename
      ? linked
      : undefined;
  const linkTargetTitle = linkTarget
    ? (plainQuestText(
        index?.chapters.find((row) => row.filename === linkTarget.filename)
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
      questHref(dataset, lang, {
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
      index={index}
      chapterJump={
        linkTarget
          ? { filename: linkTarget.filename, title: linkTargetTitle }
          : undefined
      }
    />
  ) : (
    <p className="p-4 text-sm text-muted-foreground">{selectedId}</p>
  );

  return (
    <EntryProvider dataset={dataset} lang={lang} langMap={langMap}>
      <div className="viewport-shell quest-viewport relative">
        {chapter && chapter.filename === row?.filename ? (
          <CanvasFlow
            chapter={chapter}
            dataset={dataset}
            langMap={langMap}
            gridScale={index?.book?.gridScale ?? DEFAULT_GRID_SCALE}
            questSpacing={
              index?.book?.questSpacing ?? DEFAULT_QUEST_SPACING
            }
            index={index ?? null}
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
        {selectedId ? (
          <>
            <RightSidebarPortal>
              <RightSidebarPanel>{questPanel}</RightSidebarPanel>
            </RightSidebarPortal>
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
          </>
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
          lang={lang}
          langMap={langMap}
          index={index ?? null}
        />
      </div>
    </EntryProvider>
  );
}

