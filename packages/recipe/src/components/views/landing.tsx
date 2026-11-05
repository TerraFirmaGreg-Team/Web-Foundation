import { Suspense } from 'react';
import { WorkspaceBody } from '@terrafirmagreg-team/ui/components/layouts/workspace';
import type {
  SectionLandingProps,
  SectionLandingView,
} from '@terrafirmagreg-team/kit/components/views/routes';
import type { RecipeSource } from '@terrafirmagreg-team/recipe/lib/source';
import {
  RecipeBrowser,
  RecipeBrowserFallback,
} from '@terrafirmagreg-team/recipe/components/views/browser';

export function recipeLanding({
  page,
  lang,
}: SectionLandingProps<RecipeSource>): SectionLandingView {
  return {
    node: (
      <WorkspaceBody className="viewport-body">
        <Suspense fallback={<RecipeBrowserFallback />}>
          <RecipeBrowser
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
