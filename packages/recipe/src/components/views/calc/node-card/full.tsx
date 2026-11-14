'use client';

import { memo, useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import {
  useUpdateNodeInternals,
  type NodeProps,
} from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import {
  ContextMenu,
  ContextMenuTrigger,
} from '@terrafirmagreg-team/ui/components/ui/context-menu';
import {
  HoverCard,
  HoverCardTrigger,
} from '@terrafirmagreg-team/ui/components/ui/hover-card';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { StackCount } from '@terrafirmagreg-team/game/components/entry/stack-count';
import { PagedCard } from '@terrafirmagreg-team/recipe/components/cards/paged-card';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import { useCalcSession } from '@terrafirmagreg-team/recipe/hooks/calc/use-calc-session';
import { useCalcFar } from '@terrafirmagreg-team/recipe/hooks/calc/use-far-mode';
import { useCalcTier } from '@terrafirmagreg-team/recipe/hooks/calc/use-tier';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import {
  recipeCardImageUrl,
  recipeImageUrl,
} from '@terrafirmagreg-team/recipe/lib/links';
import { recipeTitle } from '@terrafirmagreg-team/recipe/lib/data/parse';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { CALC_NODE_W } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import { railSpans } from '@terrafirmagreg-team/recipe/lib/calc/ports';
import type { CalcFlowNode } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import { NodeBadges } from './badges';
import { NodeChips } from './chips';
import { NodeActions } from './actions';
import { PortRailIn, PortRailOut } from './port-rails';
import { NodeContextMenu, NodeHoverContent } from './menu';

export const CalcNodeCardFull = memo(function CalcNodeCardFull({
  data,
  id,
  selected,
}: NodeProps<CalcFlowNode>) {
  const {
    node,
    dataset,
    mode,
    recipeBody,
    onRequestPicker,
    onRequestMemberPicker,
    onCrafts,
  } = data;
  const t = useTranslations();
  const session = useCalcSession();
  const farCards = useCalcFar();
  const lang = session?.lang ?? 'en_us';
  const names = session?.names ?? {};
  const langMap = session?.langMap;
  const tier = useCalcTier();
  const lodOk = tier === 'near';
  const [imgFail, setImgFail] = useState(false);
  const name = recipeItemName(names, lang, node.materialId);
  const recipes = node.availableRecipes;
  const body = node.recipe ? recipeBody(node.recipe.recipeId) : undefined;
  const src = body
    ? (recipeImageUrl(dataset, body) ??
      recipeCardImageUrl(dataset, body.id))
    : undefined;
  const lod = farCards === 'full' || lodOk;
  const card = mode === 'detailed' && lod && body && src && !imgFail;

  const hoverCard =
    mode !== 'detailed' && body && src && !imgFail ? true : undefined;
  const hasAlternatives =
    recipes.length > 1 ||
    (node.tagId != null && (node.members?.length ?? 0) > 1);
  const category = node.recipe
    ? session?.index?.categories?.find(
        (row) =>
          row.id ===
          recipes.find((r) => r.recipeId === node.recipe!.recipeId)
            ?.category,
      )
    : undefined;

  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    setImgFail(false);
  }

  const staged = !lodOk && card;
  const [bodyReady, setBodyReady] = useState(false);
  const [prevStaged, setPrevStaged] = useState(staged);
  if (prevStaged !== staged) {
    setPrevStaged(staged);
    if (!staged) setBodyReady(false);
  }
  useEffect(() => {
    if (!staged || bodyReady) return;
    const id = setTimeout(() => setBodyReady(true), 0);
    return () => clearTimeout(id);
  }, [staged, bodyReady]);
  const cardOn = card && (!staged || bodyReady);

  useEffect(
    () => () => {
      railSpans.delete(id);
    },
    [id],
  );

  const skeleton =
    mode === 'detailed' && node.recipe != null && !cardOn;
  const stateCls = cn(
    node.cycle && 'border-red-500/70',
    !node.cycle && node.recipe && 'border-primary/60',
    !node.recipe && 'border-dashed border-muted-foreground/50',
    selected && 'ring-2 ring-primary/70',
  );

  const interactive = tier === 'near';
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(id);
  }, [
    id,
    updateNodeInternals,
    mode,
    interactive,
    node.recipe?.recipeId,
    node.inputs.length,
    node.outputs.length,
  ]);
  const innerContent = (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2 py-1',
        mode === 'mini' ? 'items-center px-1.5' : '',
      )}
    >
      {mode === 'mini' ? (
        <div className="mx-3 flex w-auto flex-col items-center gap-0.5">
          <Entry
            id={node.materialId}
            kind={node.kind}
            dataset={dataset}
            lang={lang}
            langMap={langMap}
            name={name}
            size="lg"
            href={false}
            tooltip="adaptive"
            badge={<StackCount count={node.produced} />}
          />
          <span className="w-full truncate px-0.5 text-center text-[9px] leading-tight text-muted-foreground">
            {name}
          </span>
          <NodeChips
            node={node}
            mini
            name={name}
            category={category}
            hasAlternatives={hasAlternatives}
            dataset={dataset}
            lang={lang}
            langMap={langMap}
            onRequestPicker={onRequestPicker}
            onRequestMemberPicker={onRequestMemberPicker}
          />
        </div>
      ) : (
        <>
          <div className="mx-1 flex min-w-0 items-center gap-1.5">
            <Entry
              id={node.materialId}
              kind={node.kind}
              dataset={dataset}
              lang={lang}
              langMap={langMap}
              size="lg"
              labeled
              href={false}
              tooltip="adaptive"
              badge={<StackCount count={node.produced} />}
              className="min-w-0 flex-1 justify-start truncate"
            />
            <NodeChips
              node={node}
              mini={false}
              name={name}
              category={category}
              hasAlternatives={hasAlternatives}
              dataset={dataset}
              lang={lang}
              langMap={langMap}
              onRequestPicker={onRequestPicker}
              onRequestMemberPicker={onRequestMemberPicker}
            />
          </div>
          <div className="mx-1 flex min-w-0 items-center gap-1">
            {interactive ? (
              <span className="nodrag ml-auto flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  aria-label={t('Fewer crafts', { note: 'recipe.calc.crafts.down' })}
                  className="grid size-4 place-items-center rounded border border-border bg-background text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCrafts(id, Math.max(1, node.crafts - 1));
                  }}
                >
                  <Minus className="size-2.5" />
                </button>
                <input
                  key={node.crafts}
                  type="number"
                  min={1}
                  defaultValue={node.crafts}
                  title={t('Crafts', { note: 'recipe.calc.crafts.title' })}
                  aria-label={t('Crafts', { note: 'recipe.calc.crafts.title' })}
                  className="w-9 rounded border border-transparent bg-transparent text-center tabular-nums hover:border-border focus:border-border focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  onBlur={(e) => {
                    const next = Math.max(
                      1,
                      Math.round(Number(e.target.value) || 1),
                    );
                    if (next !== node.crafts) onCrafts(id, next);
                    else e.target.value = String(node.crafts);
                  }}
                />
                <button
                  type="button"
                  aria-label={t('More crafts', { note: 'recipe.calc.crafts.up' })}
                  className="grid size-4 place-items-center rounded border border-border bg-background text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCrafts(id, node.crafts + 1);
                  }}
                >
                  <Plus className="size-2.5" />
                </button>
              </span>
            ) : null}
          </div>
        </>
      )}
      {cardOn && body && src ? (
        <div
          className="nodrag relative z-20 mx-auto mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <PagedCard
            recipe={body}
            dataset={dataset}
            lang={lang}
            langMap={langMap}
            title={recipeTitle(body, langMap ?? {})}
            src={src}
            naturalW={body.w}
            naturalH={body.h}
            interactive={false}
            slotTooltip={interactive ? 'adaptive' : 'none'}
            eager
            onFail={() => setImgFail(true)}
          />
        </div>
      ) : skeleton ? (
        <Skeleton
          className="nodrag mx-auto mt-1 max-w-full"
          style={
            body?.w && body.h
              ? { width: body.w, height: body.h }
              : { width: CALC_NODE_W - 16, height: 40 }
          }
        />
      ) : null}
    </div>
  );
  const hoverBody =
    interactive && hoverCard ? (
      <HoverCardTrigger render={innerContent} />
    ) : (
      innerContent
    );
  const cardBody = (
    <div
      data-calc-card
      className={cn(
        'relative flex h-full w-full select-none flex-col text-xs outline-none',
        'rounded-md border bg-card',
        stateCls,
      )}
    >
      <PortRailIn
        node={node}
        data={data}
        dataset={dataset}
        lang={lang}
        langMap={langMap}
        names={names}
        connectable={interactive}
      />
      {hoverBody}
      <PortRailOut
        node={node}
        data={data}
        dataset={dataset}
        lang={lang}
        langMap={langMap}
        names={names}
        connectable={interactive}
      />
      {interactive ? <NodeActions data={data} nodeId={id} /> : null}
      <NodeBadges node={node} />
    </div>
  );
  if (!interactive) return cardBody;
  return (
    <HoverCard>
      <ContextMenu>
        <ContextMenuTrigger render={cardBody} />
        <NodeContextMenu data={data} lang={lang} langMap={langMap} />
      </ContextMenu>
      {hoverCard ? (
        <NodeHoverContent
          data={data}
          lang={lang}
          langMap={langMap}
          category={category}
          body={body}
          src={src}
          name={name}
          onFail={() => setImgFail(true)}
        />
      ) : null}
    </HoverCard>
  );
});

