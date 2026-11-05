import { Suspense } from 'react';
import { WorkspaceBody } from '@terrafirmagreg-team/ui/components/layouts/workspace';
import type {
  SectionLandingProps,
  SectionLandingView,
} from '@terrafirmagreg-team/kit/components/views/routes';
import type { QuestSource } from '@terrafirmagreg-team/quest/lib/source';
import {
  QuestBrowser,
  QuestBrowserFallback,
} from '@terrafirmagreg-team/quest/components/views/browser';

export function questLanding({
  page,
  lang,
}: SectionLandingProps<QuestSource>): SectionLandingView {
  return {
    node: (
      <WorkspaceBody className="viewport-body">
        <Suspense fallback={<QuestBrowserFallback />}>
          <QuestBrowser
            dataset={page.dataset.id}
            datasetTitle={page.datasetTitle ?? page.dataset.id}
            lang={lang}
            versions={page.versions}
          />
        </Suspense>
      </WorkspaceBody>
    ),
    workspace: { full: true, pagination: false },
  };
}
