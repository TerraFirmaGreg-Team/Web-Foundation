import 'server-only';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import sharp from 'sharp';
import { clientDumpLangNames, clientRegistryIconEntry } from '../client/dump';
import {
  loadClientRegistryIcons,
  resolveClientStackDisplay,
} from '../client/registry';
import { loadClientTagMembers } from '../client/tags';
import {
  isIconKind,
  isTagKind,
  parseStackId,
  stackIdFromRef,
  tagKindOf,
  type ReferenceKind,
  type TaggedReference,
} from '../contract/ref';
import { cleanDumpRel, dumpRelPublicUrl } from '../paths';
import type { DumpRegistryKind } from '../data/registry/dto';
import type { SpriteEntry } from '../gen';
import { texturePublicUrl } from './urls';
import {
  langString,
  stackDisplayName,
  stripMcFormat,
} from './lang/names';

export async function ogStackName(
  dataset: DatasetRef,
  id: string,
  kind: 'item' | 'fluid',
  lang: Lang,
): Promise<string> {
  const [map, items, fluids] = await Promise.all([
    clientDumpLangNames(dataset, lang),
    loadClientRegistryIcons(dataset, 'items'),
    loadClientRegistryIcons(dataset, 'fluids'),
  ]);
  const langKey = resolveClientStackDisplay(id, items, fluids)?.name;
  return stripMcFormat(stackDisplayName(map, id, kind, langKey)).trim();
}

export function ogIconParam(
  ref: TaggedReference | undefined,
): string | undefined {
  if (!ref || !isIconKind(ref.kind)) return undefined;
  return `${ref.kind}:${stackIdFromRef(ref)}`;
}

const ICON_KIND: Record<string, DumpRegistryKind> = {
  item: 'items',
  block: 'blocks',
  fluid: 'fluids',
  entity: 'entities',
};

async function ogSpriteIcon(
  dataset: DatasetRef,
  registryKind: DumpRegistryKind,
  compactId: string,
): Promise<string | undefined> {
  const parsed = parseStackId(compactId);
  const ns = parsed.id.includes(':')
    ? parsed.id.split(':', 1)[0]
    : 'minecraft';
  const entry = ((await clientRegistryIconEntry(
    dataset,
    registryKind,
    parsed.id,
  )) ??
    (await loadClientRegistryIcons(dataset, registryKind)).get(
      parsed.id,
    )) as
    | {
        sprite?: SpriteEntry | null;
        variants?: { sprite?: SpriteEntry | null }[];
      }
    | undefined;
  const sprite =
    entry?.sprite ??
    entry?.variants?.find((variant) => variant.sprite)?.sprite;
  if (!sprite) return undefined;
  const rel = cleanDumpRel(sprite.image);
  const url = rel ? dumpRelPublicUrl(dataset, `assets/${ns}/${rel}`) : undefined;
  if (!url) return undefined;
  const res = await fetch(url);
  if (!res.ok) return undefined;
  let image = sharp(Buffer.from(await res.arrayBuffer()))
    .extract({
      left: sprite.x,
      top: sprite.y,
      width: Math.max(1, sprite.w),
      height: Math.max(1, sprite.h),
    })
    .resize(256, 256, { kernel: 'nearest' });
  if (sprite.tint && sprite.tint !== 'none' && sprite.tintColor) {
    const hex = sprite.tintColor.replace(/^#/, '');
    image = image.tint({
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    });
  }
  const png = await image.png().toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

async function ogTextureIcon(
  dataset: DatasetRef,
  textureId: string,
): Promise<string | undefined> {
  const url = texturePublicUrl(dataset, textureId);
  if (!url) return undefined;
  const res = await fetch(url);
  if (!res.ok) return undefined;
  const png = await sharp(Buffer.from(await res.arrayBuffer()))
    .resize(256, 256, { kernel: 'nearest', fit: 'contain', background: '#0000' })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

async function ogTagIcon(
  dataset: DatasetRef,
  kind: ReferenceKind,
  tagId: string,
): Promise<string | undefined> {
  const memberKind = tagKindOf(kind);
  if (!memberKind) return undefined;
  const members = await loadClientTagMembers(dataset, memberKind);
  const hash = tagId.startsWith('#') ? tagId : `#${tagId}`;
  const firstId = members?.[hash]?.[0];
  if (!firstId) return undefined;
  const registryKind = ICON_KIND[memberKind];
  return registryKind ? ogSpriteIcon(dataset, registryKind, firstId) : undefined;
}

export async function ogStackIcon(
  dataset: DatasetRef,
  icon: string,
): Promise<string | undefined> {
  const sep = icon.indexOf(':');
  const kind = (sep > 0 ? icon.slice(0, sep) : 'item') as ReferenceKind;
  const id = sep > 0 ? icon.slice(sep + 1) : icon;
  if (kind === 'texture') return ogTextureIcon(dataset, id);
  if (isTagKind(kind)) return ogTagIcon(dataset, kind, id);
  const registryKind = ICON_KIND[kind];
  return registryKind ? ogSpriteIcon(dataset, registryKind, id) : undefined;
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
