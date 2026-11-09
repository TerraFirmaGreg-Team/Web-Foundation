import type {
  GitChangelogProps,
  GitContributorsProps,
} from 'fumadocs-page-history/ui';

export type PageHistoryData =
  | { component: 'GitChangelog'; props: GitChangelogProps }
  | { component: 'GitContributors'; props: GitContributorsProps };

export const PAGE_HISTORY_EXPORT = '_pageHistory';
