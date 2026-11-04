import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import type { SectionLandingView } from '@terrafirmagreg-team/kit/components/views/routes';
import type { DatasetLanding, SectionSource } from '@terrafirmagreg-team/kit/types';
import { timelineEntries } from '@terrafirmagreg-team/changelog/components/entries';
import {
  ChangelogTimeline,
  groupByMonth,
  monthAnchor,
} from '@terrafirmagreg-team/changelog/components/timeline';
import { ChangelogMonthLabel } from '@terrafirmagreg-team/changelog/components/month-label';

export async function changelogLanding(
  page: DatasetLanding,
  { source, route }: { source: SectionSource; route: string },
): Promise<SectionLandingView> {
  const dataset = page.dataset.id;
  const entries = await timelineEntries(
    source,
    route,
    dataset,
    page.lang,
    sectionConfig().datasetConfig[dataset]?.repo,
  );
  return {
    node: <ChangelogTimeline entries={entries} lang={page.lang} />,
    workspace: {
      toc: groupByMonth(entries, page.lang).map((month) => ({
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
