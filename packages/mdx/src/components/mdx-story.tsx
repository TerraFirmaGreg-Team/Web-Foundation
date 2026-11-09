'use client';

import { useEffect, useState } from 'react';
import { ensureStories, storyFor } from '../lib/story-registry';
import type { Story } from '@fumadocs/story/next/client';

export function MdxStory({ name }: { name?: string }) {
  const [story, setStory] = useState<Story | undefined>(() =>
    name ? storyFor(name) : undefined,
  );
  useEffect(() => {
    if (story || !name) return;
    let live = true;
    void ensureStories().then(() => {
      if (live) setStory(storyFor(name));
    });
    return () => {
      live = false;
    };
  }, [name, story]);
  return story ? <story.WithControl /> : null;
}
