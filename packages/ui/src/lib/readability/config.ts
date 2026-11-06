import { createConfigRegistry } from '@terrafirmagreg-team/ui/lib/config';

export type ReadabilityConfig = {
  isSpotlightDisabled?: (pathname: string) => boolean;
};

const { register: registerReadabilityConfig, get: readabilityConfig } =
  createConfigRegistry<ReadabilityConfig>('readability');

export { registerReadabilityConfig, readabilityConfig };

