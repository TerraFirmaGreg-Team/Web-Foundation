import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { asStringList } from '@terrafirmagreg-team/dump/lib/dump/contract/read';
import type { RecipeCompactIndex, RecipeCompactRow } from '@terrafirmagreg-team/recipe/types';
import { registryId, splitDumpId } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { resolveClientTag } from '@terrafirmagreg-team/dump/lib/dump/client/tags';
import {
  loadRegistryEntrySlice,
  loadTagSlice,
  loadTypeRows,
  resolveRecipeRows,
} from '@terrafirmagreg-team/recipe/lib/client-index';
import { stackIdFromRef } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { loadFluidIoIndex } from '@terrafirmagreg-team/recipe/lib/browser/fluid-outputs';

export { registryId, tagPseudoId } from '@terrafirmagreg-team/dump/lib/dump/paths';

function uniqueRows(rows: RecipeCompactRow[]): RecipeCompactRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

const ALL_KINDS = ['item', 'block', 'fluid', 'entity'];

async function entryEdges(
  dataset: DatasetRef,
  kinds: string[],
  id: string,
  field: 'usedBy' | 'producedBy',
): Promise<string[]> {
  const edges = await Promise.all(
    kinds.map((kind) =>
      loadRegistryEntrySlice(dataset, kind, id).then((entry) =>
        asStringList(entry?.[field]),
      ),
    ),
  );
  return [...new Set(edges.flat())];
}

export async function recipesForOutput(
  dataset: DatasetRef,
  index: RecipeCompactIndex,
  item: string,
  opts?: { includeTagRows?: boolean },
): Promise<RecipeCompactRow[]> {
  const base = registryId(item);
  const [refs, io] = await Promise.all([
    entryEdges(dataset, ALL_KINDS, base, 'producedBy'),
    index.fluids?.includes(base)
      ? loadFluidIoIndex(dataset, index).catch(() => undefined)
      : undefined,
  ]);
  const extra = io?.outputs.get(base) ?? [];
  const ids = extra.length ? [...new Set([...refs, ...extra])] : refs;
  const keepTagRows = opts?.includeTagRows ?? false;
  return (await resolveRecipeRows(dataset, index, ids, opts)).filter(
    (row) =>
      row.out.includes(base) ||
      (keepTagRows &&
        (row.cat ?? index.types[row.type]) === 'emi:tag'),
  );
}

export async function usesForInput(
  dataset: DatasetRef,
  index: RecipeCompactIndex,
  item: string,
  kind: string = 'item',
  opts?: { includeTagRows?: boolean },
): Promise<RecipeCompactRow[]> {
  const base = registryId(item);
  const ns = splitDumpId(base)?.ns;
  if (!ns) return [];
  const tagKinds = [...new Set(kind === 'item' ? ['item', 'block'] : [kind])];
  const stationTypes = (index.categories ?? [])
    .filter((cat) =>
      (cat.workstations ?? []).some(
        (ref) => registryId(stackIdFromRef(ref)) === base,
      ),
    )
    .map((cat) => cat.id);
  const [refs, io, stationRows, ...tagSlices] = await Promise.all([
    entryEdges(dataset, ALL_KINDS, base, 'usedBy'),
    index.fluids?.includes(base)
      ? loadFluidIoIndex(dataset, index).catch(() => undefined)
      : undefined,
    Promise.all(
      stationTypes.map((typeId) => loadTypeRows(dataset, index, typeId)),
    ),
    ...tagKinds.map((tagKind) => loadTagSlice(dataset, tagKind, ns)),
  ]);
  const tagKeys: string[] = [];
  const acceptedTags = new Set<string>();
  for (const [i, slice] of tagSlices.entries()) {
    const registry = `${tagKinds[i]}s`;
    for (const tag of slice[base] ?? slice[item] ?? []) {
      const raw = tag.startsWith('#') ? tag.slice(1) : tag;
      acceptedTags.add(`#${raw}`);
      const parts = splitDumpId(raw);
      if (parts) tagKeys.push(`${parts.ns}:${registry}/${parts.path}`);
    }
  }
  const tagRefs = (
    await Promise.all(
      [...new Set(tagKeys)].map(async (key) => {
        const parts = splitDumpId(key);
        const tag = parts
          ? await resolveClientTag(dataset, `${parts.ns}:${parts.path}`)
          : undefined;
        return tag?.usedBy ?? [];
      }),
    )
  ).flat();
  const ioRefs = io?.inputs.get(base) ?? [];
  const allRefs = ioRefs.length
    ? [...new Set([...refs, ...ioRefs])]
    : refs;
  const [refRows, tagRows] = await Promise.all([
    resolveRecipeRows(dataset, index, allRefs, {
      includeTagRows: false,
      ...opts,
    }),
    resolveRecipeRows(dataset, index, tagRefs, {
      includeTagRows: false,
      ...opts,
    }),
  ]);
  return uniqueRows([
    ...refRows.filter((row) => row.in.includes(base)),
    ...tagRows.filter((row) =>
      row.in.some((id) => acceptedTags.has(id)),
    ),
    ...stationRows.flat(),
  ]);
}

