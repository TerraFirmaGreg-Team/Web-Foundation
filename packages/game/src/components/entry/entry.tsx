'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { parseSectionLocation } from '@terrafirmagreg-team/sites/location';
import type { ReactElement } from 'react';
import { EntryIcon } from '@terrafirmagreg-team/game/components/entry/icon';
import { EntryTooltip } from '@terrafirmagreg-team/game/components/entry/tooltip';
import { CopyIdMenu } from '@terrafirmagreg-team/game/components/entry/copy-id-menu';
import { useEntryContext } from '@terrafirmagreg-team/game/hooks/use-entry-context';
import { useLangMap } from '@terrafirmagreg-team/game/hooks/use-lang-map';
import { ResolvedLangContext } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { useContext, useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@terrafirmagreg-team/ui/components/ui/tooltip';
import {
  classifyRefId,
  isIconKind,
  isTagKind,
  refId,
} from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { formatNbt } from '@terrafirmagreg-team/dump/lib/snbt';
import { fetchEntityModel } from '@terrafirmagreg-team/game/lib/entry/icon-load';
import { useDumpLocation } from '@terrafirmagreg-team/game/hooks/use-dump-location';
import { createDumpAssetResolver } from '@terrafirmagreg-team/dump/lib/dump/assets/urls';
import { GlbViewer } from '@terrafirmagreg-team/ui/components/blocks/media/glb/viewer';
import { stackIdFromRef } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';
import { stackDisplay } from '@terrafirmagreg-team/game/lib/entry/display';
import { loadStackDisplay } from '@terrafirmagreg-team/game/lib/entry/tooltip';
import { useAsyncResult } from '@terrafirmagreg-team/ui/hooks/use-async-value';
import {
  resolveEntryHref,
  tooltipLoadKind,
  usesStackTooltip,
} from '@terrafirmagreg-team/game/lib/entry/entry';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type {
  BlockDirectiveProps,
  EntityDirectiveProps,
  EntryProps,
  FluidDirectiveProps,
  ItemDirectiveProps,
  KindEntryProps,
  RecipeDirectiveProps,
  TagDirectiveProps,
} from '@terrafirmagreg-team/game/types/entry';

export function Entry({
  reference: referenceProp,
  id,
  kind,
  tag,
  copy,
  dataset: datasetProp,
  name: nameProp,
  lang: langProp,
  langMap: langMapProp,
  size = 'md',
  variant = 'plain',
  badge,
  badgeClassName,
  labeled = false,
  label,
  className,
  missing,
  tooltip,
  children,
  entityView,
  icon: iconProp,
  ...hrefOpts
}: EntryProps) {
  const ctx = useEntryContext();
  const pathname = usePathname();
  const locId = parseSectionLocation(pathname).dataset;
  const dataset =
    datasetProp ?? ctx?.dataset ?? (locId ? { id: locId } : undefined);
  const resolvedLang = useContext(ResolvedLangContext)?.lang;
  const lang = langProp ?? ctx?.lang ?? resolvedLang;
  const fetchedLangMap = useLangMap(
    dataset,
    lang,
    langMapProp === undefined && !ctx?.langMap,
  );
  const langMap = langMapProp ?? ctx?.langMap ?? fetchedLangMap;
  const classified = id ? classifyRefId(id, kind) : undefined;
  const reference =
    referenceProp ??
    (classified && tag !== undefined ? { ...classified, tag } : classified);
  const refKind = reference?.kind;
  const refIdStr = reference?.id ?? id ?? '';
  const iconKind = refKind && isIconKind(refKind) ? refKind : undefined;
  const stackId = reference ? stackIdFromRef(reference) : refIdStr;
  const displayKey =
    dataset &&
    stackId &&
    (refKind === 'item' ||
      refKind === 'block' ||
      refKind === 'fluid' ||
      refKind === 'entity')
      ? `${dataset.id}/${dataset.version ?? ''}:${stackId}`
      : undefined;
  const displayPeek =
    displayKey && dataset
      ? loadStackDisplay.peek(
          dataset,
          stackId,
          refKind === 'fluid'
            ? 'fluid'
            : refKind === 'entity'
              ? 'entity'
              : 'item',
        )
      : undefined;
  const stackDisplayRes = useAsyncResult(
    displayKey && dataset && displayPeek === undefined
      ? async () => ({
          key: displayKey,
          display: await loadStackDisplay(
            dataset,
            stackId,
            refKind === 'fluid'
              ? 'fluid'
              : refKind === 'entity'
                ? 'entity'
                : 'item',
          ),
        })
      : false,
    [dataset, stackId, displayKey, refKind, displayPeek],
  );
  const stackMissing =
    displayKey !== undefined &&
    displayPeek === undefined &&
    !stackDisplayRes.pending &&
    stackDisplayRes.value?.key === displayKey &&
    stackDisplayRes.value.display === undefined;
  const langKey =
    displayPeek !== undefined
      ? displayPeek?.name
      : stackDisplayRes.value && stackDisplayRes.value.key === displayKey
        ? stackDisplayRes.value.display?.name
        : undefined;
  const display = stackDisplay(langMap, stackId, refKind, langKey);
  const name = nameProp ?? display.name;
  const preferVariant =
    reference?.tag === undefined &&
    (refKind === 'item' || refKind === 'block' || refKind === 'fluid') &&
    langMap !== undefined &&
    !display.localized;
  const resolved =
    dataset && !stackMissing
      ? resolveEntryHref({
          reference,
          id: refIdStr,
          kind: refKind,
          tag,
          dataset,
          name,
          lang,
          ...hrefOpts,
        })
      : undefined;
  const faceClass = cn('inline-flex items-center justify-center', className);

  const icon = (
    <EntryIcon
      reference={iconProp ?? reference}
      id={iconProp ? refId(iconProp) : refIdStr}
      kind={
        iconProp
          ? isIconKind(iconProp.kind)
            ? iconProp.kind
            : undefined
          : iconKind
      }
      tag={tag}
      dataset={dataset}
      size={size}
      labeled={labeled}
      label={label ?? (labeled ? name : undefined)}
      missing={missing}
      chip={variant === 'chip'}
      preferVariant={preferVariant}
      entityView={entityView}
      badge={badge}
      badgeClassName={badgeClassName}
    >
      {children}
    </EntryIcon>
  );

  let face: ReactElement = resolved ? (
    <Link
      href={resolved}
      className={faceClass}
      aria-label={name}
    >
      {icon}
    </Link>
  ) : (
    <span className={faceClass}>{icon}</span>
  );

  const copyNbt = reference?.tag !== undefined ? formatNbt(reference.tag) : undefined;
  const copyId =
    reference && isTagKind(reference.kind)
      ? `#${reference.id.replace(/^#+/, '')}`
      : refIdStr;
  if (copy && refIdStr) {
    face = (
      <CopyIdMenu id={copyId} nbt={copyNbt}>
        {face}
      </CopyIdMenu>
    );
  }

  if (tooltip === false) return face;
  const tooltipLevel = typeof tooltip === 'string' ? tooltip : undefined;
  if (dataset && (tooltip || usesStackTooltip(refKind))) {
    return (
      <EntryTooltip
        dataset={dataset}
        id={reference ? refId(reference) : (id ?? '')}
        name={name}
        kind={tooltipLoadKind(refKind)}
        lang={lang}
        langMap={langMap}
        level={tooltipLevel}
      >
        {face}
      </EntryTooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger render={face} />
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}

function kindEntry<P extends KindEntryProps>(kind: EntryProps['kind']) {
  function KindEntry(props: P) {
    return <Entry kind={kind} {...props} />;
  }
  return KindEntry;
}

export const ItemEntry = kindEntry<ItemDirectiveProps>('item');
export const BlockEntry = kindEntry<BlockDirectiveProps>('block');
export const FluidEntry = kindEntry<FluidDirectiveProps>('fluid');
export function EntityEntry({
  view = 'auto',
  id,
  dataset: datasetProp,
  name,
  ...rest
}: EntityDirectiveProps) {
  const ctx = useEntryContext();
  const pathname = usePathname();
  const locId = parseSectionLocation(pathname).dataset;
  const dataset = useMemo(
    () =>
      datasetProp ?? ctx?.dataset ?? (locId ? { id: locId } : undefined),
    [datasetProp, ctx, locId],
  );
  const modelKey = dataset && id ? `${dataset.id}/${dataset.version ?? ''}:${id}` : undefined;
  const modelRes = useAsyncResult(
    view === 'model' && modelKey
      ? async () => ({
          key: modelKey,
          url: await fetchEntityModel(dataset!, id!),
        })
      : false,
    [view, dataset, id, modelKey],
  );
  useDumpLocation(dataset);
  const resolveResource = useMemo(
    () => (dataset ? createDumpAssetResolver(dataset) : undefined),
    [dataset],
  );
  if (view === 'model') {
    const model = modelRes.value;
    const src = model && model.key === modelKey ? model.url : undefined;
    if (src === undefined) return null;
    return src ? (
      <GlbViewer src={src} title={name ?? id} resolveResource={resolveResource} />
    ) : (
      <Entry kind="entity" id={id} dataset={dataset} name={name} {...rest} />
    );
  }
  return (
    <Entry
      kind="entity"
      id={id}
      dataset={dataset}
      name={name}
      entityView={view}
      {...rest}
    />
  );
}
export const TagEntry = kindEntry<TagDirectiveProps>('itemTag');
export const RecipeEntry = kindEntry<RecipeDirectiveProps>('recipe');

