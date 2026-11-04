import { sectionConfig } from './config';
import type { SectionKey, SectionSourceEntry } from '@terrafirmagreg-team/kit/types';

export const sections: Partial<Record<SectionKey, SectionSourceEntry>> =
  new Proxy(
    {},
    {
      get: (_, key: string) => sectionConfig().sources[key as SectionKey],
      has: (_, key: string) =>
        Object.hasOwn(sectionConfig().sources ?? {}, key as string),
      ownKeys: () => Reflect.ownKeys(sectionConfig().sources ?? {}),
      getOwnPropertyDescriptor: (_, key: string) =>
        Object.hasOwn(sectionConfig().sources, key)
          ? {
              enumerable: true,
              configurable: true,
              value: sectionConfig().sources[key as SectionKey],
            }
          : undefined,
    },
  );

