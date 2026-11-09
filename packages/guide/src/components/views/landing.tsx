import { Suspense } from 'react';
import { WorkspaceBody } from '@terrafirmagreg-team/ui/components/layouts/workspace';
import type {
  SectionLandingProps,
  SectionLandingView,
} from '@terrafirmagreg-team/kit/components/views/routes';
import type { GuideSource } from '@terrafirmagreg-team/guide/lib/source';
import {
  GuideBrowser,
  GuideBrowserFallback,
} from '@terrafirmagreg-team/guide/components/views/browser';
import { feedbackEnabled } from '@terrafirmagreg-team/discussions/lib/comments/server';
import { onBlockFeedbackAction } from '@terrafirmagreg-team/discussions/lib/feedback';
import { PageFooterFeedback } from '@terrafirmagreg-team/discussions/components/page-features';
import { PageActionsRight } from '@terrafirmagreg-team/analytics/components/page-features';

export function guideLanding({
  page,
  lang,
}: SectionLandingProps<GuideSource>): SectionLandingView {
  return {
    node: (
      <WorkspaceBody className="viewport-body">
        <Suspense fallback={<GuideBrowserFallback />}>
          <GuideBrowser
            dataset={page.dataset.id}
            datasetTitle={page.datasetTitle ?? page.dataset.id}
            lang={lang}
            versions={page.versions}
            onBlockFeedback={
              feedbackEnabled() ? onBlockFeedbackAction : undefined
            }
            actionsRight={<PageActionsRight />}
            footer={<PageFooterFeedback />}
          />
        </Suspense>
      </WorkspaceBody>
    ),
    workspace: { pagination: false },
  };
}
