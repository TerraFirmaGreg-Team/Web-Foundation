import { createSectionRoutes } from '@terrafirmagreg-team/kit/components/views/routes';
import { ogDeepLink } from '@terrafirmagreg-team/preview/server';
import { questLanding } from '@terrafirmagreg-team/quest/components/views/landing';
import { questTrees } from '@terrafirmagreg-team/quest/components/tree';
import { getQuestSource } from '@terrafirmagreg-team/quest/lib/source';
import '@terrafirmagreg-team/quest/lib/og';

export function questRoutes() {
  return createSectionRoutes({
    section: 'quest',
    trees: questTrees,
    source: { getSource: getQuestSource },
    landing: questLanding,
    deepLink: ogDeepLink('quest'),
  });
}
