import 'server-only';
import { createElement } from 'react';
import type * as PageTree from 'fumadocs-core/page-tree';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { loadMergedLangMap } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/load';
import { asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { loadDatasetDump } from '@terrafirmagreg-team/dump/lib/dump/mods/load';
import { DUMP_POINTER_TTL } from '@terrafirmagreg-team/dump/lib/dump/json-reader';
import { createAsyncCache } from '@terrafirmagreg-team/data/lib/async-cache';
import { clientDumpJson } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { keyTreeNode } from '@terrafirmagreg-team/translate/server';
import { loadLocaleRegistry } from '@terrafirmagreg-team/translate/server';
import { encodeQueryValue } from '@terrafirmagreg-team/translate/lib/url';
import {
  type DatasetRef,
  sectionUrl,
  versionSuffix,
} from '@terrafirmagreg-team/sites/location';
import { bookOptionId } from '@terrafirmagreg-team/guide/lib/nav/paths';
import { bookSlug, toBook } from '@terrafirmagreg-team/guide/lib/book';
import { sectionDatasets } from '@terrafirmagreg-team/kit/lib/datasets';
import type { GuideBookJson, GuideBookRef } from '@terrafirmagreg-team/guide/lib/data/dto';
import type { SectionTrees } from '@terrafirmagreg-team/kit/types';

function bookIcon(
  dataset: DatasetRef,
  raw: GuideBookJson | undefined,
): React.ReactNode {
  const cover = asRecord(raw?.cover);
  const coverId = asString(cover?.id) ?? undefined;
  if (!coverId) return undefined;
  return createElement(
    'span',
    {
      'data-icon': true,
      className:
        'inline-flex size-3.5 shrink-0 items-center justify-center overflow-hidden',
    },
    createElement(Entry, {
      dataset,
      id: coverId,
      kind: 'item',
      size: 14,
      href: false,
      tooltip: false,
      missing: 'hide',
    }),
  );
}

function bookLeaf(
  dataset: DatasetRef,
  ref: GuideBookRef,
  slug: string,
  raw: GuideBookJson | undefined,
  map: Record<string, string>,
): PageTree.Item {
  const book = toBook(raw, ref, slug, map);
  const bookId = bookOptionId(ref.modId, ref.bookPath);
  return keyTreeNode({
    type: 'page',
    name: book.name,
    url: `${sectionUrl('guide', dataset.id)}?book=${encodeQueryValue(bookId)}${versionSuffix(dataset)}`,
    icon: bookIcon(dataset, raw),
    $id: `${dataset.id}/${dataset.version ?? ''}/book/${bookId}`,
  }) as PageTree.Item;
}

async function datasetBookLeaves(
  dataset: DatasetRef,
  langMap: Record<string, string>,
): Promise<PageTree.Node[]> {
  const dump = await loadDatasetDump(dataset);
  if (!dump) return [];
  const taken = new Set<string>();
  const leaves: PageTree.Node[] = [];
  for (const mod of dump.mods) {
    const raws = await Promise.all(
      mod.books.map((ref) =>
        clientDumpJson(dataset, `${ref.dir}/book.json`).then(
          (raw) => asRecord(raw) as GuideBookJson | undefined,
        ),
      ),
    );
    for (const [i, ref] of mod.books.entries()) {
      const raw = raws[i];
      if (!raw) continue;
      let slug = bookSlug(raw, ref);
      if (taken.has(slug)) {
        let n = 2;
        while (taken.has(`${slug}-${n}`)) n += 1;
        slug = `${slug}-${n}`;
      }
      taken.add(slug);
      leaves.push(bookLeaf(dataset, ref, slug, raw, langMap));
    }
  }
  return leaves;
}

const guideTreesCache = createAsyncCache(
  async (): Promise<SectionTrees> => buildGuideTrees(),
  () => 'guide-trees',
  DUMP_POINTER_TTL,
);

export function guideTrees(): Promise<SectionTrees> {
  return guideTreesCache();
}

async function buildGuideTrees(): Promise<SectionTrees> {
  const { defaultLanguage } = loadLocaleRegistry();
  const datasets = await sectionDatasets('guide');
  const trees: SectionTrees = {};
  for (const { id, title: datasetTitle, languages } of datasets) {
    for (const lang of languages ?? [defaultLanguage]) {
      const map = await loadMergedLangMap({ id }, lang);
      (trees[lang] ??= {})[id] = {
        name: datasetTitle ?? id,
        children: await datasetBookLeaves({ id }, map),
        $id: `guide/${id}/${lang}`,
      } satisfies PageTree.Root;
    }
  }
  return trees;
}

