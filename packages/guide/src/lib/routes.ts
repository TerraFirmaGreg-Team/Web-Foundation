import { createSectionRoutes } from '@terrafirmagreg-team/kit/components/views/routes';
import { ogDeepLink } from '@terrafirmagreg-team/preview/server';
import { GuideTreeFeature } from '@terrafirmagreg-team/guide/components/views/layout';
import { GuideBookSwitcher } from '@terrafirmagreg-team/guide/components/book-switcher';
import { guideLanding } from '@terrafirmagreg-team/guide/components/views/landing';
import { guideTrees } from '@terrafirmagreg-team/guide/components/tree';
import { getGuideSource } from '@terrafirmagreg-team/guide/lib/source';
import '@terrafirmagreg-team/guide/lib/og';

export function guideRoutes() {
  return createSectionRoutes({
    section: 'guide',
    trees: guideTrees,
    source: { getSource: getGuideSource },
    layout: {
      treeFeature: GuideTreeFeature,
      sidebar: { feature: GuideBookSwitcher },
    },
    landing: guideLanding,
    deepLink: ogDeepLink('guide'),
  });
}
