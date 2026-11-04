import { createSectionSource } from '@terrafirmagreg-team/kit/lib/section/source';
import { docsRoute } from '@terrafirmagreg-team/sites';
import type { Source } from 'fumadocs-core/source';

export function createDocsSource(
  docsSource: Source,
) {
  return createSectionSource({
    route: docsRoute,
    section: 'docs',
    source: { ...docsSource, files: () => docsSource.files },
  });
}
