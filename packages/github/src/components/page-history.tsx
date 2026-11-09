import {
  GitChangelog,
  GitContributors,
} from 'fumadocs-page-history/ui';
import type { SectionPageContext } from '@terrafirmagreg-team/kit/types/features';
import {
  PAGE_HISTORY_EXPORT,
  type PageHistoryData,
} from '../types/history.ts';

export function PageHistory({ data }: { data: PageHistoryData }) {
  return data.component === 'GitChangelog' ? (
    <GitChangelog {...data.props} />
  ) : (
    <GitContributors {...data.props} />
  );
}

const isLanding = (ctx: SectionPageContext) =>
  Boolean(ctx.datasetId) && ctx.page.slugs.length === 2;

export function PageHistoryFooter({ ctx }: { ctx: SectionPageContext }) {
  const data = ctx.exports?.[PAGE_HISTORY_EXPORT] as
    | PageHistoryData
    | undefined;
  if (!data) return null;
  if (data.component === 'GitContributors' && isLanding(ctx)) return null;
  return <PageHistory data={data} />;
}
