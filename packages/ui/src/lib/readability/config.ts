import { createConfigRegistry } from '@terrafirmagreg-team/ui/lib/config';

export type ReadabilityConfig = {
  isSpotlightDisabled?: (pathname: string) => boolean;
};

const { register: registerReadabilityConfig, get: readabilityConfig } =
  createConfigRegistry<ReadabilityConfig>();

export { registerReadabilityConfig, readabilityConfig };

