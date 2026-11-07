import { PageActionsRight } from '@terrafirmagreg-team/analytics/components/page-features';
import {
  PageBodyFeatures,
  PageComments,
  PageFooterFeedback,
} from '@terrafirmagreg-team/discussions/components/page-features';
import { PageHistoryFooter } from '@terrafirmagreg-team/history/components/page-history';
import type { SectionFeatures } from '@terrafirmagreg-team/kit/types/features';

export const docsPageFeatures: SectionFeatures = {
  actionsRight: () => <PageActionsRight />,
  wrapBody: (body) => <PageBodyFeatures>{body}</PageBodyFeatures>,
  footer: (ctx) => (
    <>
      <PageHistoryFooter ctx={ctx} />
      <PageFooterFeedback />
    </>
  ),
  comments: () => <PageComments />,
};
