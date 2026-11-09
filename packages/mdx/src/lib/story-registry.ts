import type { Story } from '@fumadocs/story/next/client';

const registry = ((globalThis as Record<symbol, unknown>)[
  Symbol.for('terrafirmagreg.mdx.stories')
] ??= {}) as Record<string, Story>;

const state = ((globalThis as Record<symbol, unknown>)[
  Symbol.for('terrafirmagreg.mdx.storyLoader')
] ??= {}) as {
  load?: () => Promise<unknown>;
  loaded?: Promise<unknown>;
};

export function registerStory(name: string, story: Story): void {
  registry[name] = story;
}

export function storyFor(name: string): Story | undefined {
  return registry[name];
}

export function registerStoryLoader(load: () => Promise<unknown>): void {
  state.load = load;
}

export function ensureStories(): Promise<unknown> {
  return (state.loaded ??= state.load?.() ?? Promise.resolve());
}
