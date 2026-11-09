import { PageActionsRight } from '@terrafirmagreg-team/analytics/components/page-features';
import {
  PageBodyFeatures,
  PageComments,
  PageFooterFeedback,
} from '@terrafirmagreg-team/discussions/components/page-features';
import { PageHistoryFooter } from '@terrafirmagreg-team/github/components/page-history';
import { RepoContributors } from '@terrafirmagreg-team/github/components/contributors';
import type { SectionFeatures } from '@terrafirmagreg-team/kit/types/features';

export const changelogPageFeatures: SectionFeatures = {
  actionsRight: () => <PageActionsRight />,
  wrapBody: (body) => <PageBodyFeatures>{body}</PageBodyFeatures>,
  footer: (ctx) => (
    <>
      <RepoContributors ctx={ctx} />
      <PageHistoryFooter ctx={ctx} />
      <PageFooterFeedback />
    </>
  ),
  comments: () => <PageComments />,
};
