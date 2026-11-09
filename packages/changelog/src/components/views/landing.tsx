import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import { WorkspaceBody } from '@terrafirmagreg-team/ui/components/layouts/workspace';
import type {
  SectionLandingProps,
  SectionLandingView,
} from '@terrafirmagreg-team/kit/components/views/routes';
import type { SectionSource } from '@terrafirmagreg-team/kit/types';
import { Suspense } from 'react';
import { timelineEntries } from '@terrafirmagreg-team/changelog/components/entries';
import {
  ChangelogBrowser,
  ChangelogBrowserFallback,
} from '@terrafirmagreg-team/changelog/components/views/browser';
import {
  groupByMonth,
  monthAnchor,
} from '@terrafirmagreg-team/changelog/components/timeline';
import { ChangelogMonthLabel } from '@terrafirmagreg-team/changelog/components/month-label';

export async function changelogLanding({
  page,
  lang,
  source,
  route,
}: SectionLandingProps<SectionSource>): Promise<SectionLandingView> {
  const dataset = page.dataset.id;
  const { entries, metas } = await timelineEntries(
    source,
    route,
    dataset,
    lang,
    sectionConfig().datasetConfig[dataset]?.github?.repo,
    { count: 10 },
  );
  return {
    node: (
      <WorkspaceBody>
        <Suspense fallback={<ChangelogBrowserFallback />}>
          <ChangelogBrowser
            entries={entries}
            lang={lang}
            more={{ dataset, total: metas.length }}
          />
        </Suspense>
      </WorkspaceBody>
    ),
    workspace: {
      toc: groupByMonth(metas, lang).map((month) => ({
        title: <ChangelogMonthLabel monthKey={month.key} />,
        url: `#${monthAnchor(month.key)}`,
        depth: 2,
      })),
      breadcrumb: {
        items: [
          { name: 'Changelog', url: route },
          { name: page.datasetTitle ?? dataset },
        ],
      },
      pagination: false,
    },
  };
}
