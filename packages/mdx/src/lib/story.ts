'use client';

import { defineStoryFactory } from '@fumadocs/story/next/client';
import { DocsWithControl } from '../components/story-panel';

export { md } from './md';

export const { defineStory } = defineStoryFactory({
  WithControl: DocsWithControl,
});

