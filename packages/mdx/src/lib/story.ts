'use client';

import { defineStoryFactory } from '@fumadocs/story/next/client';
import type {
  Story,
  StoryOptions,
} from '@fumadocs/story/next/client';
import { DocsWithControl } from '../components/story-panel';
import type { ComponentType } from 'react';

export { useStory } from '@fumadocs/story';
export { useDataEngine } from '@fumari/stf';
export { md } from './md';

const factory = defineStoryFactory({
  WithControl: DocsWithControl,
});

const registry = ((globalThis as Record<symbol, unknown>)[
  Symbol.for('terrafirmagreg.mdx.stories')
] ??= {}) as Record<string, Story>;

export function defineStory<C extends ComponentType<any>>(
  options: StoryOptions<C>,
): Story<C> {
  const story = factory.defineStory(options);
  if (options.displayName)
    registry[options.displayName] = story as Story;
  return story;
}

export function storyFor(name: string): Story | undefined {
  return registry[name];
}
