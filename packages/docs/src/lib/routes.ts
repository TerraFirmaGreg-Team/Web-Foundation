import { createSectionRoutes } from '@terrafirmagreg-team/kit/components/views/routes';
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import { createGitFileUrl } from '@terrafirmagreg-team/kit/lib/urls';
import { docsLanding } from '@terrafirmagreg-team/docs/components/views/landing';
import { docsPage } from '@terrafirmagreg-team/docs/components/views/browser';

export function docsRoutes() {
  return createSectionRoutes({
    section: 'docs',
    trees: (lang) =>
      sectionConfig().sources.docs?.trees?.(lang) ?? Promise.resolve({}),
    source: { getSource: () => sectionConfig().sources.docs!.getSource() },
    features: {
      fileUrl: (filePath) => createGitFileUrl(sectionConfig().git!)(filePath),
    },
    layout: { defaultOpenLevel: Infinity },
    landing: docsLanding,
    page: docsPage,
  });
}
