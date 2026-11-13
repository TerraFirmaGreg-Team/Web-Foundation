import { datasetCacheKey, datasetUrlVersion, type DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { AdvancedIndex } from 'fumadocs-core/search/server';
import { dumpTextString, langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { clientDumpLangGuide } from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { formatGuide } from '@terrafirmagreg-team/guide/lib/display/format';
import { isIndexPage } from '@terrafirmagreg-team/guide/lib/page-kind';
import type { DumpIndex } from '@terrafirmagreg-team/dump/lib/dump/mods/dto';

export type GuideIndex = AdvancedIndex & { locale: string };

export interface DumpSource {
  getJson(rel: string): Promise<unknown | undefined>;
}

type DumpTextNode = Parameters<typeof dumpTextString>[1];

function plainText(raw: string, macros?: Record<string, string>): string {
  let out = '';
  for (const node of formatGuide(raw, { macros })) {
    if (node.type === 'break') out += '\n';
    else out += (node.type === 'command' ? node.label : undefined) ?? node.value;
  }
  return out
    .replace(/\s*\$\([^)]*$/, '')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function resolveText(
  map: Record<string, string>,
  node: unknown,
  macros?: Record<string, string>,
): string | undefined {
  if (typeof node === 'string') {
    const bare =
      node.startsWith('{') && node.endsWith('}')
        ? node.slice(1, -1).trim()
        : undefined;
    const resolved = langString(map, node) ?? bare ?? (bare ? undefined : node);
    return resolved ? plainText(resolved, macros) || undefined : undefined;
  }
  if (Array.isArray(node)) {
    const parts = node
      .map((item) => resolveText(map, item, macros))
      .filter((part): part is string => Boolean(part));
    return parts.length ? parts.join('\n') : undefined;
  }
  if (node && typeof node === 'object') {
    const resolved = dumpTextString(map, node as DumpTextNode);
    return resolved ? plainText(resolved, macros) || undefined : undefined;
  }
  return undefined;
}

interface RawPage {
  anchor?: unknown;
  title?: unknown;
  texts?: unknown;
}

interface RawEntry {
  display?: { name?: unknown };
  pages?: RawPage[];
}

interface RawBook {
  id?: unknown;
  entries?: Record<string, string>;
  macros?: Record<string, string>;
}

function entryIndex(
  dataset: DatasetRef,
  bookId: string,
  entryId: string,
  entry: RawEntry,
  map: Record<string, string>,
  lang: string,
  macros?: Record<string, string>,
) {
  const title =
    resolveText(map, entry.display?.name, macros) ??
    entryId.split('/').pop() ??
    entryId;
  const contents = (entry.pages ?? [])
    .map((page) => {
      if (isIndexPage(page, map)) return null;
      const heading = resolveText(map, page.title, macros);
      const content = resolveText(map, page.texts, macros);
      return content ? { heading: heading ?? title, content } : null;
    })
    .filter((c): c is { heading: string; content: string } => c !== null);
  const body = contents.map((c) => c.content).join('\n');
  if (!body && !title) return null;
  const params = new URLSearchParams({ book: bookId, entry: entryId });
  const pinned = datasetUrlVersion(dataset);
  if (pinned) params.set('version', pinned);
  const refKey = datasetCacheKey(dataset);
  return {
    title,
    url: `/guide/${dataset.id}?${params}`,
    id: `guide:${refKey}:${bookId}:${entryId}:${lang}`,
    tag: `guide:${refKey}`,
    locale: lang,
    structuredData: { headings: [], contents },
  };
}

async function bookIndexes(
  dataset: DatasetRef,
  dir: string,
  bookId: string,
  langs: string[],
  source: DumpSource,
): Promise<GuideIndex[]> {
  const book = (await source.getJson(`${dir}/book.json`)) as
    | RawBook
    | undefined;
  const buckets = book?.entries;
  if (!buckets || typeof buckets !== 'object') return [];
  const maps = new Map(
    await Promise.all(
      langs.map(
        async (lang) => [lang, await clientDumpLangGuide(dataset, lang)] as const,
      ),
    ),
  );
  const bucketDocs = new Map<string, Record<string, RawEntry> | undefined>();
  await Promise.all(
    [...new Set(Object.values(buckets))].map(async (rel) => {
      bucketDocs.set(
        rel,
        (await source.getJson(`${dir}/${rel}`)) as
          | Record<string, RawEntry>
          | undefined,
      );
    }),
  );
  const out: GuideIndex[] = [];
  for (const [entryId, rel] of Object.entries(buckets)) {
    const entry = bucketDocs.get(rel)?.[entryId];
    if (!entry) continue;
    for (const lang of langs) {
      const index = entryIndex(
        dataset,
        bookId,
        entryId,
        entry,
        maps.get(lang) ?? {},
        lang,
        book.macros,
      );
      if (index) out.push(index);
    }
  }
  return out;
}

export async function guideSearchIndexes(
  dataset: DatasetRef,
  dump: DumpIndex,
  source: DumpSource,
): Promise<GuideIndex[]> {
  const langs = dump.manifest.languages?.length
    ? dump.manifest.languages
    : ['en_us'];
  const out: GuideIndex[] = [];
  for (const mod of dump.mods) {
    for (const book of mod.books) {
      out.push(
        ...(await bookIndexes(dataset, book.dir, book.bookId, langs, source)),
      );
    }
  }
  const seen = new Set<string>();
  return out.filter((index) => {
    const key = `${index.locale}:${index.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
