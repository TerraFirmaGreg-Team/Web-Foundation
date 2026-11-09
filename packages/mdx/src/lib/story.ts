'use client';

import { defineStoryFactory } from '@fumadocs/story/next/client';
import type {
  Story,
  StoryOptions,
} from '@fumadocs/story/next/client';
import { DocsWithControl } from '../components/story-panel';
import { registerStory } from './story-registry';
import type { ComponentType } from 'react';

export { useStory } from '@fumadocs/story';
export { useDataEngine } from '@fumari/stf';
export { md } from './md';

const factory = defineStoryFactory({
  WithControl: DocsWithControl,
});

export function defineStory<C extends ComponentType<any>>(
  options: StoryOptions<C>,
): Story<C> {
  const story = factory.defineStory(options);
  if (options.displayName) registerStory(options.displayName, story as Story);
  return story;
}
