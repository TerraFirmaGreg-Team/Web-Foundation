import { createSectionRoutes } from '@terrafirmagreg-team/kit/components/views/routes';
import { sectionConfig } from '@terrafirmagreg-team/kit/lib/config';
import { createGitFileUrl } from '@terrafirmagreg-team/kit/lib/urls';
import { changelogLanding } from '@terrafirmagreg-team/changelog/components/views/landing';
import { changelogPage } from '@terrafirmagreg-team/changelog/components/views/browser';

export function changelogRoutes() {
  return createSectionRoutes({
    section: 'changelog',
    trees: (lang) =>
      sectionConfig().sources.changelog?.trees?.(lang) ??
      Promise.resolve({}),
    source: {
      getSource: () => sectionConfig().sources.changelog!.getSource(),
      history: false,
    },
    features: {
      fileUrl: (filePath) =>
        createGitFileUrl(sectionConfig().git!)(filePath),
    },
    landing: changelogLanding,
    page: changelogPage,
  });
}
