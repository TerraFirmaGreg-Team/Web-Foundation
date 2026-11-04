import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { asRecord, asString } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import { joinDumpRel } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { bareId } from '@terrafirmagreg-team/guide/lib/paths';
import type { GuideEntry } from '@terrafirmagreg-team/guide/types';
import type { GuideMultiblock } from '@terrafirmagreg-team/guide/lib/data/dto';
import type {
  GuideBookJson,
  GuideBookRef,
} from '@terrafirmagreg-team/guide/lib/data/dto';
import {
  bookSlug,
  indexBookRows,
  toBook,
  type BookRows,
} from '@terrafirmagreg-team/guide/lib/book';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import type { GuideIndex } from '@terrafirmagreg-team/guide/types';
import {
  clientDumpJson,
  clientDumpLang,
  clientDumpLangRaw,
} from '@terrafirmagreg-team/dump/lib/dump/client/dump';
import { loadDatasetDump } from '@terrafirmagreg-team/dump/lib/dump/mods/load';
import { createDatasetCache } from '@terrafirmagreg-team/dump/lib/dump/reader';

type BookRow = {
  ref: GuideBookRef;
  slug: string;
  raw?: GuideBookJson;
};

const listedBookRows = createDatasetCache(
  async (dataset: DatasetRef): Promise<BookRow[]> => {
    const dump = await loadDatasetDump(dataset);
    if (!dump) return [];
    const raws = await Promise.all(
      dump.mods.flatMap((mod) =>
        mod.books.map(async (ref) => ({
          ref,
          raw: asRecord(
            await clientDumpJson(dataset, `${ref.dir}/book.json`),
          ) as GuideBookJson | undefined,
        })),
      ),
    );
    const rows: BookRow[] = [];
    const taken = new Set<string>();
    for (const { ref, raw } of raws) {
      if (!raw) continue;
      let slug = bookSlug(raw, ref);
      if (taken.has(slug)) {
        let n = 2;
        while (taken.has(`${slug}-${n}`)) n += 1;
        slug = `${slug}-${n}`;
      }
      taken.add(slug);
      rows.push({ ref, slug, raw });
    }
    return rows;
  },
);

function listedBodies(
  bookDir: string,
  index: Record<string, unknown> | undefined,
): { files: string[]; ids: string[] } {
  const files: string[] = [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const [id, value] of Object.entries(index ?? {})) {
    if (!id || typeof value !== 'string' || !value) continue;
    const rel = joinDumpRel(`${bookDir}/x`, value);
    if (!rel) continue;
    ids.push(id);
    if (!seen.has(rel)) {
      seen.add(rel);
      files.push(rel);
    }
  }
  return { files, ids };
}

async function bookRows(
  dataset: DatasetRef,
  row: BookRow,
  lang: Lang,
): Promise<BookRows | null> {
  if (!row.raw) return null;
  const bookDir = row.ref.dir;
  const listed = row.raw as Record<string, unknown>;
  const entryList = listedBodies(
    bookDir,
    listed.entries as Record<string, unknown> | undefined,
  );
  const categoryList = listedBodies(
    bookDir,
    listed.categories as Record<string, unknown> | undefined,
  );
  const bucketDocs = new Map<string, Record<string, unknown>>();
  const categoryDocs = new Map<string, Record<string, unknown>>();
  await Promise.all([
    ...entryList.files.map(async (rel) => {
      const doc = asRecord(await clientDumpJson(dataset, rel));
      if (doc) bucketDocs.set(rel, doc);
    }),
    ...categoryList.files.map(async (rel) => {
      const doc = asRecord(await clientDumpJson(dataset, rel));
      if (doc) categoryDocs.set(rel, doc);
    }),
  ]);
  const entries: BookRows['entries'] = [];
  for (const [id, value] of Object.entries(
    (listed.entries as Record<string, unknown> | undefined) ?? {},
  )) {
    if (!id || typeof value !== 'string' || !value) continue;
    const rel = joinDumpRel(`${bookDir}/x`, value);
    const body = rel ? bucketDocs.get(rel)?.[id] : undefined;
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      entries.push({ id, raw: body as Record<string, unknown> });
    }
  }
  entries.sort((a, b) => a.id.localeCompare(b.id));
  const categories: BookRows['categories'] = [];
  for (const [id, value] of Object.entries(
    (listed.categories as Record<string, unknown> | undefined) ?? {},
  )) {
    if (!id || typeof value !== 'string' || !value) continue;
    const rel = joinDumpRel(`${bookDir}/x`, value);
    const raw = rel ? categoryDocs.get(rel) : undefined;
    if (raw) categories.push({ id, raw });
  }
  categories.sort((a, b) => a.id.localeCompare(b.id));
  return {
    ref: row.ref,
    slug: row.slug,
    raw: row.raw,
    entries,
    categories,
    contentLanguage: lang,
    isFallback: false,
  };
}

export const loadClientGuideBook = createDatasetCache(
  async (
    dataset: DatasetRef,
    lang: Lang,
    bookSlugValue: string,
  ): Promise<GuideIndex | null> => {
    const row = (await listedBookRows(dataset)).find(
      (entry) =>
        entry.slug === bookSlugValue || entry.ref.bookId === bookSlugValue,
    );
    if (!row) return null;
    const [rows, langMap, rawLang] = await Promise.all([
      bookRows(dataset, row, lang),
      clientDumpLang(dataset, lang),
      clientDumpLangRaw(dataset, lang),
    ]);
    if (!rows) return null;
    return indexBookRows(rows, dataset, lang, langMap, rawLang);
  },
  (dataset, lang, bookSlugValue) => `${dataset.id}/${dataset.version ?? ''}${lang}${bookSlugValue}`,
);

export type ClientGuideEntryHit = {
  entry: GuideEntry;
  modId?: string;
  bookPath?: string;
};

export async function findClientGuideEntry(
  dataset: DatasetRef,
  lang: Lang,
  entryId: string,
): Promise<ClientGuideEntryHit | undefined> {
  const needle = bareId(entryId);
  const nameNeedle = entryId.trim().toLowerCase();
  for (const row of await listedBookRows(dataset)) {
    const entries = (row.raw as Record<string, unknown> | undefined)?.entries;
    const overview = await loadClientGuideBook(dataset, lang, row.slug);
    const match =
      entries && typeof entries === 'object'
        ? Object.keys(entries).find(
            (key) => bareId(key) === needle || key === entryId,
          )
        : undefined;
    const entry = overview?.entries.find(
      (item) =>
        item.id === match ||
        bareId(item.id) === needle ||
        item.name?.trim().toLowerCase() === nameNeedle,
    );
    if (entry) {
      return {
        entry,
        modId: overview?.modId,
        bookPath: overview?.bookPath,
      };
    }
  }
  return undefined;
}

export const loadMultiblockNameIndex = createDatasetCache(
  async (
    dataset: DatasetRef,
    lang: Lang,
  ): Promise<Record<string, GuideMultiblock>> => {
    const index: Record<string, GuideMultiblock> = {};
    const put = (key: string | undefined, spec: GuideMultiblock) => {
      const normalized = key?.trim().toLowerCase();
      if (normalized) index[normalized] ??= spec;
    };
    for (const row of await listedBookRows(dataset)) {
      const overview = await loadClientGuideBook(dataset, lang, row.slug);
      for (const entry of overview?.entries ?? []) {
        for (const page of entry.pages ?? []) {
          const spec = page?.multiblock;
          if (!spec) continue;
          const display = asRecord(
            (page as Record<string, unknown>).display,
          );
          put(asString(display?.name) ?? page.name ?? page.title, spec);
          put(entry.id, spec);
          put(entry.name, spec);
        }
      }
    }
    return index;
  },
);

export async function listClientGuideBookSummaries(
  dataset: DatasetRef,
  lang: Lang,
): Promise<
  Array<{
    modId: string;
    bookId: string;
    slug: string;
    name: string;
    landingText?: string;
  }>
> {
  const langMap = await clientDumpLang(dataset, lang);
  const rows = await listedBookRows(dataset);
  return rows
    .map((row) => {
      const book = toBook(row.raw, row.ref, row.slug, langMap);
      return {
        modId: row.ref.modId,
        bookId: row.ref.bookId,
        slug: row.slug,
        name: book.name,
        ...(book.landingText ? { landingText: book.landingText } : {}),
      };
    })
    .sort((a, b) => a.bookId.localeCompare(b.bookId));
}

