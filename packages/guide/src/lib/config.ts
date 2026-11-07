import type { ComponentType } from 'react';
import type { TranslationState } from '@terrafirmagreg-team/translate/server';
import { createConfigRegistry, uiConfig } from '@terrafirmagreg-team/ui/lib/config';
import '@terrafirmagreg-team/guide/lib/preview';
import '@terrafirmagreg-team/guide/lib/search/filter';

export type GuidePageActionsProps = {
  copied?: TranslationState;
  crowdinUrl?: string;
  mdUrl?: string;
  githubUrl?: string;
};

export type GuideConfigInput = {
  appName?: string;
  components?: {
    PageActions?: ComponentType<GuidePageActionsProps>;
    UntranslatedCallout?: ComponentType<{ copied?: TranslationState }>;
  };
};

export type GuideConfig = {
  appName: string;
  components: {
    PageActions: ComponentType<GuidePageActionsProps>;
    UntranslatedCallout: ComponentType<{ copied?: TranslationState }>;
  };
};

const { register: registerGuideConfig, get: guideConfig } = createConfigRegistry<
  GuideConfigInput,
  GuideConfig
>('guide', (overrides) => ({
  appName: overrides.appName ?? uiConfig().brand?.name ?? '',
  components: {
    PageActions: (overrides.components?.PageActions ??
      uiConfig().components?.PageActions) as ComponentType<GuidePageActionsProps>,
    UntranslatedCallout: (overrides.components?.UntranslatedCallout ??
      uiConfig().components?.UntranslatedCallout) as ComponentType<{
      copied?: TranslationState;
    }>,
  },
}));

export { registerGuideConfig, guideConfig };

