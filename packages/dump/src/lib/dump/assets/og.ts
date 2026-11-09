import 'server-only';
import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';
import sharp from 'sharp';
import { clientDumpLang } from '../client/dump';
import {
  loadClientRegistryNs,
  resolveClientStackDisplay,
} from '../client/registry';
import { parseStackId } from '../contract/ref';
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
  const base = parseStackId(id).id;
  const ns = base.includes(':') ? base.split(':', 1)[0] : 'minecraft';
  const [map, items, fluids] = await Promise.all([
    clientDumpLang(dataset, lang),
    loadClientRegistryNs(dataset, 'items', ns),
    loadClientRegistryNs(dataset, 'fluids', ns),
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
