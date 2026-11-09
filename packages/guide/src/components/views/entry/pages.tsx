import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { ReactNode } from 'react';
import { PageText } from '@terrafirmagreg-team/guide/components/views/page/text';
import {
  EntityPage,
  ImagePage,
  MultiMultiblockPage,
  MultiblockPage,
  MultiblockVisual,
} from '@terrafirmagreg-team/guide/components/views/kind/media';
import {
  LinkPage,
  QuestPage,
  RelationPage,
} from '@terrafirmagreg-team/guide/components/views/kind/links';
import {
  RecipePage,
  SpotlightPage,
} from '@terrafirmagreg-team/guide/components/views/kind/recipe';
import { TablePage } from '@terrafirmagreg-team/guide/components/views/kind/table';
import { UnknownPage } from '@terrafirmagreg-team/guide/components/views/kind/unknown';
import type { PageRendererProps } from '@terrafirmagreg-team/guide/types';
import type { AtlasBundle } from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/dto';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import { guideMessage } from '@terrafirmagreg-team/guide/lib/display/messages';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';
import type { GuideBookMeta } from '@terrafirmagreg-team/guide/types';
import type {
  GuideBook,
  GuideEntryExtras,
  GuideEntryRef,
  GuideMessages,
  GuidePage,
} from '@terrafirmagreg-team/guide/types';
import {
  guidePageTitles,
  pageAnchors,
  pageIcons,
  repeatedTitle,
} from '@terrafirmagreg-team/guide/lib/nav/toc';
import { classify, isIndexPage, type PageKind, pageTexts } from '@terrafirmagreg-team/guide/lib/page-kind';
import {
  EntryGroup,
  GROUP_CYCLE_MS,
} from '@terrafirmagreg-team/game/components/entry/group';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';

const renderers: Record<
  Exclude<PageKind, 'empty' | 'text'>,
  (props: PageRendererProps) => ReactNode
> = {
  image: ImagePage,
  recipe: RecipePage,
  spotlight: SpotlightPage,
  entity: EntityPage,
  multiblock: MultiblockPage,
  multimultiblock: MultiMultiblockPage,
  link: LinkPage,
  relations: RelationPage,
  quest: QuestPage,
  table: TablePage,
  unknown: UnknownPage,
};

export function EntryPages({
  dataset,
  lang,
  bookPath,
  pages,
  atlases,
  meta,
  bookModId,
  categoryByEntry,
  book,
  langMap,
  entryRefs,
  keybinds,
  extras,
  questLinks,
  previews,
  messages,
}: {
  dataset: DatasetRef;
  lang: Lang;
  bookPath: string;
  pages: GuidePage[];
  atlases?: Record<string, AtlasBundle>;
  meta?: GuideBookMeta;
  bookModId: string;
  categoryByEntry: Map<string, string>;
  book?: GuideBook | null;
  langMap: Record<string, string>;
  entryRefs: Map<string, GuideEntryRef>;
  keybinds?: Record<string, string>;
  extras?: GuideEntryExtras;
  questLinks?: Record<string, { filename: string; questId: string }>;
  previews?: Record<string, PagePreviewData>;
  messages: GuideMessages;
}) {
  const titles = guidePageTitles(
    pages,
    langMap,
    {
      related: guideMessage(messages, 'guide.related'),
      objective: guideMessage(messages, 'guide.objective'),
    },
    extras?.entityNames,
  );
  const anchors = pageAnchors(pages);
  return (
    <div className="space-y-6">
      {pages.map((page, index) => {
        if (isIndexPage(page, langMap)) return null;
        const kind = classify(page.type);
        const attachedValue =
          kind === 'multiblock' || kind === 'multimultiblock'
            ? undefined
            : (page.model ?? page.multiblock);
        if (kind === 'empty' && !attachedValue && !pageTexts(page).length) {
          return null;
        }
        const rendererProps: PageRendererProps = {
          dataset,
          lang,
          bookPath,
          page,
          atlases,
          meta: meta ?? {},
          bookModId,
          categoryByEntry,
          langMap,
          entryRefs,
          keybinds,
          book,
          extras,
          questLinks,
          previews,
          messages,
        };
        const Renderer =
          kind === 'text' || kind === 'empty' ? undefined : renderers[kind];
        const heading =
          kind === 'image' || repeatedTitle(titles, index)
            ? undefined
            : titles[index];
        const icons = pageIcons(page);
        return (
          <section
            key={index}
            id={anchors[index]}
            data-block="feedback"
            className="scroll-mt-20 space-y-3"
          >
            {heading ? (
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                {icons.length > 1 ? (
                  <EntryGroup members={icons} size="lg" cycle={GROUP_CYCLE_MS} />
                ) : icons[0] ? (
                  <Entry
                    id={icons[0].id}
                    kind={icons[0].kind}
                    dataset={dataset}
                    name={heading}
                    href={false}
                    tooltip={false}
                    missing="hide"
                  />
                ) : null}
                {heading}
              </h2>
            ) : null}
            {attachedValue ? (
              <MultiblockVisual
                value={attachedValue}
                title={
                  typeof page.name === 'string' ? page.name : undefined
                }
                glbs={extras?.glbs}
              />
            ) : null}
            {Renderer ? <Renderer {...rendererProps} /> : null}
            <PageText {...rendererProps} />
          </section>
        );
      })}
    </div>
  );
}

