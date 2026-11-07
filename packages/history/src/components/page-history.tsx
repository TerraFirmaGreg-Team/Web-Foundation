import {
  GitChangelog,
  GitContributors,
} from 'fumadocs-page-history/ui';
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

export function PageHistoryFooter({
  exports,
}: {
  exports?: Record<string, unknown>;
}) {
  const data = exports?.[PAGE_HISTORY_EXPORT] as
    | PageHistoryData
    | undefined;
  return data ? <PageHistory data={data} /> : null;
}
