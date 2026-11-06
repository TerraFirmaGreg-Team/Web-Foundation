import { useMemo } from 'react';
import { GuideText } from '@terrafirmagreg-team/guide/components/views/text';
import { useDumpLocation } from '@terrafirmagreg-team/game/hooks/use-dump-location';
import { asMultiblock } from '@terrafirmagreg-team/guide/lib/multiblock/meta';
import {
  createDumpAssetResolver,
  texturePublicUrl,
} from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import { dumpRelPublicUrl } from '@terrafirmagreg-team/dump/lib/dump/paths';
import { parseStackId } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { langString } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { matchVariant } from '@terrafirmagreg-team/dump/lib/dump/data/registry/parse';
import { GlbViewer } from '@terrafirmagreg-team/ui/components/blocks/media/glb/viewer';
import { multiblockKey } from '@terrafirmagreg-team/guide/lib/multiblock';
import { guideFormatOpts } from '@terrafirmagreg-team/guide/lib/display/format';
import { spriteName } from '@terrafirmagreg-team/guide/lib/display/names';
import type { PageRendererProps } from '@terrafirmagreg-team/guide/types';
import { GlbPlaceholder } from '@terrafirmagreg-team/ui/components/blocks/media/glb/viewer';
import { Slideshow } from '@terrafirmagreg-team/ui/components/blocks/media/slideshow';
import type { GuideMultiblock } from '@terrafirmagreg-team/guide/types';

export function ImagePage(props: PageRendererProps) {
  const { dataset, page } = props;
  useDumpLocation(dataset);
  const images = [
    ...(page.images ?? []),
    ...(typeof page.image === 'string' ? [page.image] : []),
  ];
  const opts = guideFormatOpts(props);
  const title =
    typeof page.title === 'string' && page.title ? (
      <GuideText text={page.title} {...opts} />
    ) : null;
  return (
    <Slideshow
      images={
        images.length
          ? images.map((id) => ({
              id,
              url: texturePublicUrl(dataset, id) ?? null,
            }))
          : [{ id: 'missing', url: null }]
      }
      alt={typeof page.title === 'string' ? page.title : ''}
      border={page.border !== false}
      scale={page.scale}
      offset={page.offset}
      rotate={page.rotate}
      caption={title ?? undefined}
    />
  );
}

export function EntityPage({
  dataset,
  page,
  langMap,
  atlases,
  extras,
}: PageRendererProps) {
  const id = typeof page.entity === 'string' ? page.entity : undefined;
  useDumpLocation(dataset);
  const resolveResource = useMemo(
    () => createDumpAssetResolver(dataset),
    [dataset],
  );
  const parsed = id ? parseStackId(id) : undefined;
  const entry = parsed?.id ? extras?.entities?.[parsed.id] : undefined;
  const variant = matchVariant(entry?.variants, parsed?.nbt);
  const model = variant?.model ?? entry?.model;
  const ns = parsed?.id.split(':', 1)[0];
  const glb =
    model && ns
      ? dumpRelPublicUrl(dataset, `assets/${ns}/${model}`)
      : undefined;
  const name = id
    ? (langString(langMap, variant?.display?.name) ??
      langString(langMap, entry?.display?.name) ??
      spriteName(dataset, langMap, atlases, id))
    : undefined;
  return (
    <div className="space-y-2">
      {glb ? (
        <GlbViewer
          src={glb}
          title={name}
          scale={typeof page.scale === 'number' ? page.scale : undefined}
          offset={typeof page.offset === 'number' ? page.offset : undefined}
          resolveResource={resolveResource}
        />
      ) : (
        <GlbPlaceholder title={name} />
      )}
    </div>
  );
}

function MissingVisual({ title }: { title?: string }) {
  return <GlbPlaceholder title={title} />;
}

export function MultiblockVisual({
  value,
  title,
  glbs,
  resolveResource,
}: {
  value: string | GuideMultiblock | undefined;
  title?: string;
  glbs?: Record<string, string>;
  resolveResource?: (
    resourceUrl: string,
    modelUrl: string,
  ) => string | undefined;
}) {
  const spec = asMultiblock(value);
  const key = multiblockKey(spec);
  const src = key ? glbs?.[key] : undefined;
  return src ? (
    <GlbViewer src={src} title={title} resolveResource={resolveResource} />
  ) : (
    <MissingVisual title={title} />
  );
}

export function MultiblockPage({ page, dataset, extras }: PageRendererProps) {
  const modelId = typeof page.model === 'string' ? page.model : undefined;
  useDumpLocation(dataset);
  const resolveResource = useMemo(
    () => createDumpAssetResolver(dataset),
    [dataset],
  );
  return (
    <MultiblockVisual
      value={modelId ?? page.multiblock}
      title={modelId ?? page.name}
      glbs={extras?.glbs}
      resolveResource={resolveResource}
    />
  );
}

export function MultiMultiblockPage({
  page,
  dataset,
  extras,
}: PageRendererProps) {
  useDumpLocation(dataset);
  const resolveResource = useMemo(
    () => createDumpAssetResolver(dataset),
    [dataset],
  );
  const specs = (page.multiblocks ?? []).map(asMultiblock);
  const glbs = specs
    .map((spec) => multiblockKey(spec))
    .map((key) => (key ? extras?.glbs?.[key] : undefined))
    .filter((url): url is string => Boolean(url));
  return glbs.length ? (
    <GlbViewer
      sources={glbs}
      title={page.name}
      resolveResource={resolveResource}
    />
  ) : (
    <MissingVisual title={page.name} />
  );
}

