'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Minus, Plus } from 'lucide-react';
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
import { ButtonCopy } from '@terrafirmagreg-team/recipe/components/button-copy';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import { Marquee } from '@terrafirmagreg-team/ui/components/blocks/text/marquee';
import {
  formatCount,
  formatFluidAmount,
} from '@terrafirmagreg-team/ui/lib/utils/format';
import { useCalcSession } from '@terrafirmagreg-team/recipe/hooks/calc/use-calc-session';
import { useCalcFar } from '@terrafirmagreg-team/recipe/hooks/calc/use-far-mode';
import { useCalcRecipeIds } from '@terrafirmagreg-team/recipe/hooks/calc/use-recipe-ids';
import { useCalcTier } from '@terrafirmagreg-team/recipe/hooks/calc/use-tier';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import {
  recipeCardImageUrl,
  recipeImageUrl,
} from '@terrafirmagreg-team/recipe/lib/links';
import { recipeTitle } from '@terrafirmagreg-team/recipe/lib/data/parse';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { CALC_NODE_W } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import { pinnedRecipe } from '@terrafirmagreg-team/recipe/lib/calc/member';
import { railSpans } from '@terrafirmagreg-team/recipe/lib/calc/ports';
import type { CalcFlowNode } from '@terrafirmagreg-team/recipe/lib/calc/flow';
import { NodeBadges } from './badges';
import { NodeChips } from './chips';
import { NodeActions } from './actions';
import { PortRailIn, PortRailOut } from './port-rails';
import { NodeContextMenu, NodeHoverContent } from './menu';

const CRAFTS_SUFFIX: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 };

function parseCraftsInput(raw: string): number | null {
  const match = /^(\d+(?:\.\d+)?)\s*([kmb])?$/i.exec(raw.trim());
  if (!match) return null;
  const value = Math.round(
    Number(match[1]) * (CRAFTS_SUFFIX[match[2]?.toLowerCase() ?? ''] ?? 1),
  );
  return Number.isFinite(value) ? Math.max(1, value) : null;
}

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
    tagSelections,
    onRequestPicker,
    onRequestMemberPicker,
    onCrafts,
  } = data;
  const t = useTranslations();
  const session = useCalcSession();
  const farCards = useCalcFar();
  const showIds = useCalcRecipeIds();
  const lang = session?.lang ?? 'en_us';
  const names = session?.names ?? {};
  const langMap = session?.langMap;
  const tier = useCalcTier();
  const lodOk = tier === 'near';
  const [imgFail, setImgFail] = useState(false);
  const name = recipeItemName(names, lang, node.materialId);
  const recipes = node.availableRecipes;
  const rawBody = node.recipe
    ? recipeBody(node.recipe.recipeId)
    : undefined;
  const body = useMemo(
    () => (rawBody ? pinnedRecipe(rawBody, node, tagSelections) : rawBody),
    [rawBody, node, tagSelections],
  );
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

  const crafts = data.pendingCrafts?.get(id) ?? node.crafts;
  const fmtAmount =
    node.kind === 'fluid'
      ? formatFluidAmount
      : (n: number) => formatCount(n, 1_000);
  const producedTip = t('Surplus: {produced} produced, {allocated} wired, {remaining} left', {
    note: 'recipe.calc.hint.produced',
  })
    .replaceAll('{produced}', fmtAmount(node.produced))
    .replaceAll('{allocated}', fmtAmount(node.allocated))
    .replaceAll('{remaining}', fmtAmount(Math.max(0, node.remaining)));
  const producedBadge = (
    <Hint label={producedTip} side="top">
      <span className="pointer-events-auto">
        <StackCount count={node.produced} format={fmtAmount} />
      </span>
    </Hint>
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
          <span className="relative inline-flex">
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
            />
            <span className="pointer-events-none absolute -bottom-0.5 left-[34px] z-10 -translate-x-full">
              {producedBadge}
            </span>
          </span>
          <Marquee className="w-full px-0.5 text-center text-[9px] leading-tight text-muted-foreground">
            {name}
          </Marquee>
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
            <span className="relative min-w-0 flex-1">
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
                className="min-w-0 flex-1 justify-start truncate"
              />
              <span className="pointer-events-none absolute -bottom-0.5 left-[34px] z-10 -translate-x-full">
                {producedBadge}
              </span>
            </span>
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
                {[2, 4].map((div) => (
                  <button
                    key={div}
                    type="button"
                    aria-label={
                      div === 2
                        ? t('Halve crafts', { note: 'recipe.calc.crafts.d2' })
                        : t('Quarter crafts', { note: 'recipe.calc.crafts.d4' })
                    }
                    className="grid h-4 min-w-4 place-items-center rounded border border-border bg-background px-px text-[8px] font-medium leading-none text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCrafts(id, (crafts) => Math.max(1, Math.round(crafts / div)));
                    }}
                  >
                    ÷{div}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label={t('Fewer crafts', { note: 'recipe.calc.crafts.down' })}
                  className="grid size-4 place-items-center rounded border border-border bg-background text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCrafts(id, (crafts) => Math.max(1, crafts - 1));
                  }}
                >
                  <Minus className="size-2.5" />
                </button>
                <input
                  key={crafts}
                  type="text"
                  inputMode="numeric"
                  defaultValue={crafts}
                  size={Math.min(9, Math.max(3, String(crafts).length))}
                  title={`${t('Crafts', { note: 'recipe.calc.crafts.title' })}: ${String(crafts)}`}
                  aria-label={t('Crafts', { note: 'recipe.calc.crafts.title' })}
                  className="w-auto min-w-9 rounded border border-border bg-transparent text-center tabular-nums focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  onBlur={(e) => {
                    const value = parseCraftsInput(e.target.value);
                    if (value == null) {
                      e.target.value = String(crafts);
                      return;
                    }
                    onCrafts(id, value);
                  }}
                />
                <button
                  type="button"
                  aria-label={t('More crafts', { note: 'recipe.calc.crafts.up' })}
                  className="grid size-4 place-items-center rounded border border-border bg-background text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCrafts(id, (crafts) => crafts + 1);
                  }}
                >
                  <Plus className="size-2.5" />
                </button>
                {[2, 4].map((mult) => (
                  <button
                    key={mult}
                    type="button"
                    aria-label={
                      mult === 2
                        ? t('Double crafts', { note: 'recipe.calc.crafts.x2' })
                        : t('Quadruple crafts', { note: 'recipe.calc.crafts.x4' })
                    }
                    className="grid h-4 min-w-4 place-items-center rounded border border-border bg-background px-px text-[8px] font-medium leading-none text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCrafts(id, (crafts) => crafts * mult);
                    }}
                  >
                    ×{mult}
                  </button>
                ))}
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
      {showIds && body ? (
        <span className="nodrag absolute -bottom-2 left-3 z-30 flex">
          <span className="inline-flex max-w-full items-center gap-0.5 rounded-sm border border-border bg-background px-1 py-px shadow-sm">
            <code className="truncate text-[8px] leading-tight text-muted-foreground">
              {body.id}
            </code>
            <ButtonCopy
              value={body.id}
              title={t('Copy recipe id', { note: 'recipe.copy_recipe_id' })}
              aria-label={t('Copy recipe id', { note: 'recipe.copy_recipe_id' })}
              copy={<Copy className="size-2.5" />}
              copied={<Check className="size-2.5" />}
              className="size-3.5 p-0"
            />
          </span>
        </span>
      ) : null}
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

