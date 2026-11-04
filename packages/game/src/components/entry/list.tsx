'use client';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';

import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { SpriteList } from '@terrafirmagreg-team/ui/components/blocks/sprite';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

export function EntryList({
  items,
  dataset,
  lang,
  langMap,
  tab,
  type,
  variant = 'grid',
  labeled,
  href,
  className,
}: {
  items: TaggedReference[];
  dataset?: DatasetRef;
  lang?: Lang;
  langMap?: Record<string, string>;
  tab?: string;
  type?: string;
  variant?: 'grid' | 'row';

  labeled?: boolean;

  href?: string | false;
  className?: string;
}) {
  return (
    <SpriteList
      variant={variant}
      className={className}
      items={items.map((item, index) => ({
        key: `${item.kind}:${item.id}:${index}`,
        node:
          variant === 'grid' ? (
            <Entry
              reference={item}
              dataset={dataset}
              lang={lang}
              langMap={langMap}
              tab={tab}
              type={type}
              href={href}
              variant="chip"
              size="lg"
              className="size-9"
            />
          ) : (
            <Entry
              reference={item}
              dataset={dataset}
              langMap={langMap}
              labeled={labeled}
              href={href}
            />
          ),
      }))}
    />
  );
}

