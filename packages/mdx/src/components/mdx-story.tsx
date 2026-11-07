'use client';

import { storyFor } from '../lib/story';

export function MdxStory({ name }: { name?: string }) {
  const entry = name ? storyFor(name) : undefined;
  return entry ? <entry.WithControl /> : null;
}
