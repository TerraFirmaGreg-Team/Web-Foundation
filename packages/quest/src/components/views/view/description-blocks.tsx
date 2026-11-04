'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { Slideshow } from '@terrafirmagreg-team/ui/components/blocks/media/slideshow';
import { questTexturePublicUrl } from '@terrafirmagreg-team/quest/lib/image';
import { renderQuestNodes } from '@terrafirmagreg-team/quest/components/rich-text';
import { Separator } from '@terrafirmagreg-team/ui/components/ui/separator';
import type { QuestCompactIndex, QuestDescriptionBlock } from '@terrafirmagreg-team/quest/types';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

type DescriptionImage = Extract<QuestDescriptionBlock, { type: 'image' }>;

type Segment =
  | { type: 'block'; block: QuestDescriptionBlock }
  | { type: 'slideshow'; images: DescriptionImage[] };

function groupImages(blocks: QuestDescriptionBlock[]): Segment[] {
  const segments: Segment[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!;
    if (block.type !== 'image') {
      segments.push({ type: 'block', block });
      continue;
    }
    const images: DescriptionImage[] = [block];
    let j = i + 1;
    while (j < blocks.length) {
      if (blocks[j]!.type === 'image') {
        images.push(blocks[j] as DescriptionImage);
        j++;
        continue;
      }
      let k = j;
      while (blocks[k]?.type === 'break') k++;
      if (blocks[k]?.type === 'image') {
        j = k;
        continue;
      }
      break;
    }
    segments.push({ type: 'slideshow', images });
    i = j - 1;
  }
  return segments;
}

export function DescriptionBlocks({
  blocks,
  dataset,
  lang,
  index,
}: {
  blocks: QuestDescriptionBlock[];
  dataset: DatasetRef;
  lang: Lang;
  index: QuestCompactIndex | null;
}) {
  const ctx = { dataset, lang, index };
  const segments = groupImages(blocks);
  return (
    <>
      {segments.map((segment, i) => {
        if (segment.type === 'slideshow') {
          return (
            <Slideshow
              key={i}
              images={segment.images.map((image) => ({
                id: image.imageRef,
                url: questTexturePublicUrl(dataset, image.imageRef) ?? null,
              }))}
              alt=""
              border
            />
          );
        }
        const block = segment.block;
        switch (block.type) {
          case 'break':
            return <Separator key={i} />;
          case 'image':
            return null;
          case 'paragraph':
            return (
              <p key={i} className="text-sm whitespace-pre-wrap">
                {renderQuestNodes(block.nodes, ctx)}
              </p>
            );
          default: {
            const _never: never = block;
            return _never;
          }
        }
      })}
    </>
  );
}

