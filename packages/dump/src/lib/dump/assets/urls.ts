import { join, relative } from 'pathe';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type {
  AtlasPage,
  IconAtlas,
} from '@terrafirmagreg-team/dump/lib/dump/assets/atlas/dto';
import {
  cleanDumpRel,
  dumpLocation,
  dumpRelPublicUrl,
  dumpStorageUrl,
  splitDumpId,
  type DumpLocation,
} from '@terrafirmagreg-team/dump/lib/dump/paths';

export { dumpRelPublicUrl } from '@terrafirmagreg-team/dump/lib/dump/paths';

export function texturePublicUrl(
  dataset: DatasetRef,
  textureId: string,
): string | undefined {
  const parts = splitDumpId(textureId.trim());
  if (!parts) return undefined;
  const path = parts.path.startsWith('textures/')
    ? parts.path
    : `textures/${parts.path}`;
  const rel = `${path.replace(/\.(png|webp)$/i, '')}.webp`;
  return dumpRelPublicUrl(dataset, `assets/${parts.ns}/${rel}`);
}

export function modelPublicUrl(
  dataset: DatasetRef,
  namespace: string,
  rel: string | null | undefined,
): string | undefined {
  const cleaned = typeof rel === 'string' ? cleanDumpRel(rel) : null;
  return cleaned
    ? dumpRelPublicUrl(dataset, `assets/${namespace}/${cleaned}`)
    : undefined;
}

export function recipeImageUrl(
  dataset: DatasetRef,
  recipe: { modId: string; image?: string },
): string | undefined {
  const rel = recipe.image ? cleanDumpRel(recipe.image) : undefined;
  if (!rel) return undefined;
  if (rel.startsWith('assets/')) return dumpRelPublicUrl(dataset, rel);
  if (!recipe.modId) return undefined;
  return dumpRelPublicUrl(dataset, `assets/${recipe.modId}/${rel}`);
}

export function atlasPagePublicUrl(
  dataset: DatasetRef,
  atlas: IconAtlas,
  page: AtlasPage,
): string | undefined {
  const src = cleanDumpRel(page.image);
  if (!src || !atlas.modId) return undefined;
  if (src.startsWith('textures/atlas/')) {
    return dumpRelPublicUrl(dataset, `assets/atlas/${src}`);
  }
  return dumpRelPublicUrl(dataset, `assets/${atlas.modId}/${src}`);
}

function pathDir(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash >= 0 ? path.slice(0, slash + 1) : '';
}

function resolveAssetRel(baseDir: string, relUri: string): string | null {
  const depth = baseDir.split('/').filter(Boolean).length;
  const ascents = relUri.split('/').filter((seg) => seg === '..').length;
  if (ascents > depth) return null;
  const resolved = join(baseDir, relUri);
  return resolved === '.' ? null : resolved;
}

const reverseFileIndexes = new WeakMap<
  Record<string, string>,
  Map<string, string>
>();
function reverseFileIndex(files: Record<string, string>): Map<string, string> {
  let map = reverseFileIndexes.get(files);
  if (!map) {
    map = new Map(Object.entries(files).map(([rel, key]) => [key, rel]));
    reverseFileIndexes.set(files, map);
  }
  return map;
}

function dumpRelForStorageRel(
  loc: DumpLocation,
  storageRel: string,
): string | undefined {
  if (loc.files) return reverseFileIndex(loc.files).get(storageRel);
  return storageRel.startsWith(`${loc.root}/`)
    ? storageRel.slice(loc.root.length + 1)
    : undefined;
}

export function createDumpAssetResolver(
  dataset: DatasetRef,
): (resourceUrl: string, modelUrl: string) => string | undefined {

  let prefix: string | null = null;
  return (resourceUrl, modelUrl) => {
    const loc = dumpLocation(dataset);
    if (!loc) return undefined;
    const base =
      typeof window === 'undefined' ? 'http://x.invalid' : location.origin;
    prefix ??= new URL(dumpStorageUrl(''), base).href;
    let modelAbs: URL;
    try {
      modelAbs = new URL(modelUrl, base);
    } catch {
      return undefined;
    }
    const modelHref = modelAbs.href;
    if (!modelHref.startsWith(prefix)) return undefined;
    const modelRel = dumpRelForStorageRel(
      loc,
      modelHref.slice(prefix.length),
    );
    if (!modelRel) return undefined;
    const modelDirHref = pathDir(modelHref);
    let rel: string | undefined;
    if (resourceUrl.startsWith(modelDirHref)) {
      rel = resourceUrl.slice(modelDirHref.length);
    } else {
      try {
        const resource = new URL(resourceUrl, modelAbs);
        if (resource.origin !== modelAbs.origin) return undefined;
        rel = relative(pathDir(modelAbs.pathname), resource.pathname);
      } catch {
        return undefined;
      }
    }
    if (!rel || !rel.includes('/')) return undefined;
    const dumpRel = resolveAssetRel(pathDir(modelRel), rel);
    if (!dumpRel) return undefined;
    return dumpRelPublicUrl(dataset, dumpRel);
  };
}

