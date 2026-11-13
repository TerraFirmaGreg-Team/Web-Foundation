import { Suspense } from 'react';
import { WorkspaceBody } from '@terrafirmagreg-team/ui/components/layouts/workspace';
import type {
  SectionLandingProps,
  SectionLandingView,
} from '@terrafirmagreg-team/kit/components/views/routes';
import type { RecipeSource } from '@terrafirmagreg-team/recipe/lib/source';
import { dumpPreloadHrefs } from '@terrafirmagreg-team/dump/lib/dump/preloads';
import {
  RecipeBrowser,
  RecipeBrowserFallback,
} from '@terrafirmagreg-team/recipe/components/views/browser';

export async function recipeLanding({
  page,
  lang,
}: SectionLandingProps<RecipeSource>): Promise<SectionLandingView> {
  const { origin, hrefs } = await dumpPreloadHrefs({ id: page.dataset.id }, [
    'objects.json.gz',
    'manifest.json',
    'registry/items.ndjson',
    'registry/fluids.ndjson',
    'registry/items.icons.ndjson',
    'registry/fluids.icons.ndjson',
    'registry/blocks.icons.ndjson',
    'registry/tabs.ndjson',
    'registry/groups.ndjson',
    'registry/tags.ndjson',
    'registry/recipe_categories.ndjson',
    `lang/${lang}.names.ndjson`,
    `names/${lang}.ndjson`,
  ]);
  return {
    node: (
      <>
        {origin ? <link rel="preconnect" href={origin} /> : null}
        {hrefs.map((href) => (
          <link
            key={href}
            rel="preload"
            href={href}
            as="fetch"
            crossOrigin="anonymous"
          />
        ))}
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
      </>
    ),
    workspace: { full: true, pagination: false },
  };
}
