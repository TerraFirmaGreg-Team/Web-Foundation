import { createElement } from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { encodeQueryValue } from '@terrafirmagreg-team/translate/lib/url';
import {
  type DatasetRef,
  sectionUrl,
  versionSuffix,
} from '@terrafirmagreg-team/sites/location';
import { bookOptionId, guideCategoryHref } from '@terrafirmagreg-team/guide/lib/nav/paths';
import type { GuideIndex } from '@terrafirmagreg-team/guide/types';
import type { TaggedReference } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

function nodeIcon(
  dataset: DatasetRef,
  icon: TaggedReference | undefined,
  name: string,
): React.ReactNode {
  if (!icon?.id) return undefined;
  return createElement(
    'span',
    {
      key: 'icon',
      'data-icon': true,
      className:
        'inline-flex size-3.5 shrink-0 items-center justify-center overflow-hidden',
    },
    createElement(Entry, {
      dataset,
      id: icon.id,
      kind: icon.kind,
      name,
      size: 14,
      href: false,
      tooltip: false,
      missing: 'hide',
    }),
  );
}

export function guideTreeChildren(
  dataset: DatasetRef,
  index: GuideIndex,
): PageTree.Node[] {
  const bookId =
    index.bookId ??
    (index.modId && index.bookPath
      ? bookOptionId(index.modId, index.bookPath)
      : undefined);
  return index.categories.map((category): PageTree.Folder => ({
    type: 'folder',
    name: category.name,
    icon: nodeIcon(dataset, category.icon, category.name),
    index: {
      type: 'page',
      name: category.name,
      url: guideCategoryHref(
        dataset,
        undefined,
        index.modId,
        index.bookPath ?? '',
        category,
      ),
      $id: `${dataset.id}/${dataset.version ?? ''}/${index.modId}/${index.bookPath}/${category.id}#index`,
    },
    $id: `${dataset.id}/${dataset.version ?? ''}/${index.modId}/${index.bookPath}/${category.id}`,
    children: category.entries.map((entry): PageTree.Item => ({
      type: 'page',
      name: entry.name,
      url: `${sectionUrl('guide', dataset.id)}?book=${encodeQueryValue(bookId ?? '')}&entry=${encodeQueryValue(entry.id)}${versionSuffix(dataset)}`,
      icon: nodeIcon(dataset, entry.icon, entry.name),
      $id: `${dataset.id}/${dataset.version ?? ''}/${index.modId}/${index.bookPath}/${category.id}/${entry.id}`,
    })),
  }));
}

