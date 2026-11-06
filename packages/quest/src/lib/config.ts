import { createConfigRegistry, uiConfig } from '@terrafirmagreg-team/ui/lib/config';
import '@terrafirmagreg-team/quest/lib/preview';
import '@terrafirmagreg-team/quest/lib/embed';

export type QuestConfigInput = {
  appName?: string;
};

const { register: registerQuestConfig, get: questConfig } = createConfigRegistry<
  QuestConfigInput,
  { appName: string }
>((overrides) => ({
  appName: overrides.appName ?? uiConfig().brand?.name ?? '',
}));

export { registerQuestConfig, questConfig };

