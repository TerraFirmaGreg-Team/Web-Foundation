import 'server-only';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import sharp from 'sharp';
import { loadClientModAtlases } from '../client/atlases';
import { clientDumpLang } from '../client/dump';
import {
  loadClientRegistry,
  resolveClientStackDisplay,
} from '../client/registry';
import {
  refId,
  type ReferenceKind,
  type TaggedReference,
} from '../contract/ref';
import { lookupSpriteInBundle } from './atlas/lookup';
import {
  langString,
  stackDisplayName,
  stripMcFormat,
} from './lang/names';
import { atlasPagePublicUrl, texturePublicUrl } from './urls';

export type OgSprite = {
  url: string;
};

async function pngSprite(
  input: Buffer,
  extract?: { left: number; top: number; width: number; height: number },
): Promise<OgSprite> {
  let img = sharp(input);
  if (extract) img = img.extract(extract);
  const png = await img
    .resize(144, 144, { kernel: 'nearest', fit: 'inside' })
    .png()
    .toBuffer();
  return { url: `data:image/png;base64,${png.toString('base64')}` };
}

async function loadSprite(
  dataset: DatasetRef,
  ref: string | TaggedReference,
  id: string,
  kind: ReferenceKind | undefined,
): Promise<OgSprite | undefined> {
  if (kind === 'texture') {
    const url = texturePublicUrl(dataset, id);
    if (!url) return undefined;
    try {
      return await pngSprite(
        Buffer.from(await (await fetch(url)).arrayBuffer()),
      );
    } catch {
      return undefined;
    }
  }
  const ns = id.includes(':') ? id.slice(0, id.indexOf(':')) : 'minecraft';
  const bundle = await loadClientModAtlases(dataset, ns);
  const hit = lookupSpriteInBundle(bundle, ref);
  if (!hit) return undefined;
  const url = atlasPagePublicUrl(dataset, hit.atlas, hit.page);
  if (!url) return undefined;
  return pngSprite(Buffer.from(await (await fetch(url)).arrayBuffer()), {
    left: hit.sprite.x,
    top: hit.sprite.y,
    width: hit.sprite.w,
    height: hit.sprite.h,
  });
}

const spriteCache = new Map<string, Promise<OgSprite | undefined>>();

export function ogSpriteFor(
  dataset: DatasetRef,
  ref: string | TaggedReference,
): Promise<OgSprite | undefined> {
  const id = typeof ref === 'string' ? ref : refId(ref);
  const kind = typeof ref === 'string' ? undefined : ref.kind;
  const key = `${dataset.id}|${dataset.version ?? ''}|${kind ?? ''}|${id}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;
  if (spriteCache.size > 512) spriteCache.clear();
  const promise = loadSprite(dataset, ref, id, kind).then(
    (value) => value,
    () => {
      spriteCache.delete(key);
      return undefined;
    },
  );
  spriteCache.set(key, promise);
  return promise;
}

export async function ogRefSprite(
  dataset: DatasetRef,
  ref: TaggedReference | undefined,
): Promise<OgSprite | undefined> {
  if (!ref) return undefined;
  try {
    return await ogSpriteFor(dataset, ref);
  } catch {
    return undefined;
  }
}

export async function ogIconSprite(
  dataset: DatasetRef,
  icon: string | undefined,
  iconKind: ReferenceKind | undefined,
): Promise<OgSprite | undefined> {
  if (!icon) return undefined;
  return ogRefSprite(dataset, { kind: iconKind ?? 'item', id: icon });
}

export async function ogStackName(
  dataset: DatasetRef,
  id: string,
  kind: 'item' | 'fluid',
  lang: Lang,
): Promise<string> {
  const [map, items, fluids] = await Promise.all([
    clientDumpLang(dataset, lang),
    loadClientRegistry(dataset, 'items'),
    loadClientRegistry(dataset, 'fluids'),
  ]);
  const langKey = resolveClientStackDisplay(id, items, fluids)?.name;
  return stripMcFormat(stackDisplayName(map, id, kind, langKey)).trim();
}

export async function ogPngDataUri(input: Buffer): Promise<string> {
  const png = await sharp(input)
    .resize(256, 256, { kernel: 'nearest' })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

export function ogLocalized(
  map: Record<string, string>,
  key: string | undefined,
): string | undefined {
  return key ? (langString(map, key) ?? key) : undefined;
}
