'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useResolvedLang } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import { replaceUrlState } from '@terrafirmagreg-team/ui/lib/utils/history';
import { recipeItemName } from '@terrafirmagreg-team/recipe/lib/client-index';
import { useFluidColors } from '@terrafirmagreg-team/recipe/hooks/alloy/use-fluid-colors';
import { recipeHref } from '@terrafirmagreg-team/recipe/lib/links';
import {
  INGOT_MB,
  checkMix,
  ingotRatioMix,
  minimalAdditions,
  scaleAmounts,
  snapToIngots,
  suggestAmounts,
} from '@terrafirmagreg-team/recipe/lib/alloy/mix';
import type { AlloyComponent, AlloyRecipe } from '@terrafirmagreg-team/recipe/types/alloy';
import type { RecipeSession } from '@terrafirmagreg-team/recipe/types';

function seedMix(
  components: readonly AlloyComponent[],
  unit: 'mb' | 'ingot',
  mixParam: string | undefined,
): { inputs: string[]; total: string } {
  const parts = mixParam?.split(';').map((value) => value.trim());
  if (
    parts &&
    parts.length === components.length &&
    parts.every((value) => value !== '' && Number.isFinite(Number(value)))
  ) {
    return {
      inputs: parts,
      total: String(
        Number(parts.reduce((sum, value) => sum + Number(value), 0).toFixed(3)),
      ),
    };
  }
  const ratio = ingotRatioMix(components);
  if (unit === 'ingot' && ratio) {
    return { inputs: ratio.counts.map(String), total: String(ratio.total) };
  }
  return {
    inputs: (suggestAmounts(components, 144) ?? []).map(String),
    total: '144',
  };
}

export function useMixState(recipe: AlloyRecipe, session: RecipeSession) {
  const t = useTranslations();
  const name = (id: string) =>
    recipeItemName(session.names, session.lang, id);
  const slots = useMemo(
    () => recipe.components.map(({ slot }) => slot),
    [recipe.components],
  );
  const colors = useFluidColors(session.dataset, slots);
  const [unit, setUnit] = useState<'mb' | 'ingot'>(() =>
    session.alloyUnit === 'ingot' ? 'ingot' : 'mb',
  );
  const factor = unit === 'ingot' ? INGOT_MB : 1;

  const [seed] = useState(() =>
    seedMix(recipe.components, unit, session.alloyMix),
  );
  const [total, setTotal] = useState(seed.total);
  const [inputs, setInputs] = useState(seed.inputs);
  const [seen, setSeen] = useState({
    unit: session.alloyUnit,
    mix: session.alloyMix,
  });

  const num = (value: string) => Number(value.replace(',', '.'));
  const trim = (value: number) => String(Number(value.toFixed(3)));
  const totalNumber = num(total);
  const amounts = useMemo(
    () => inputs.map((value) => num(value) || 0),
    [inputs],
  );

  if (session.alloyUnit !== seen.unit || session.alloyMix !== seen.mix) {
    setSeen({ unit: session.alloyUnit, mix: session.alloyMix });
    if (
      session.alloyUnit !== (unit === 'ingot' ? 'ingot' : undefined) ||
      session.alloyMix !== amounts.map((value) => trim(value)).join(';')
    ) {
      const nextUnit = session.alloyUnit === 'ingot' ? 'ingot' : 'mb';
      const next = seedMix(recipe.components, nextUnit, session.alloyMix);
      setUnit(nextUnit);
      setInputs(next.inputs);
      setTotal(next.total);
    }
  }

  const resolved = useResolvedLang();
  useEffect(() => {
    const mix = amounts.map((value) => trim(value)).join(';');
    replaceUrlState(
      recipeHref(session.dataset, resolved, {
        tool: 'alloy',
        id: recipe.recipe.id,
        tab: session.tab,
        unit: unit === 'ingot' ? 'ingot' : undefined,
        mix,
        version: session.nav.version,
      }),
    );
  }, [
    unit,
    amounts,
    recipe.recipe.id,
    session.dataset,
    resolved,
    session.tab,
    session.nav.version,
  ]);
  const mix = useMemo(
    () => checkMix(recipe.components, amounts),
    [recipe.components, amounts],
  );
  const fix = useMemo(
    () => minimalAdditions(recipe.components, amounts),
    [recipe.components, amounts],
  );
  const ratioMix = useMemo(
    () => ingotRatioMix(recipe.components),
    [recipe.components],
  );
  const step = unit === 'ingot' ? 1 : INGOT_MB;
  const presets =
    unit === 'ingot' ? [1, 4, 10, 32, 64] : [144, 576, 1440, 4608, 9216];
  const econTotal =
    Number.isFinite(totalNumber) && totalNumber > 0 ? totalNumber : mix.total;
  const needsSnap = amounts.some(
    (value) => Math.abs((value * factor) % INGOT_MB) > 1e-6,
  );
  const snapped = useMemo(
    () =>
      needsSnap
        ? snapToIngots(
            recipe.components,
            amounts.map((value) => value * factor),
          )
        : null,
    [needsSnap, recipe.components, amounts, factor],
  );
  const output = recipe.recipe.outputs[0];
  const unitLabel =
    unit === 'ingot' ? t('ing.', { note: 'recipe.alloy.unit.ingot' }) : t('mB', { note: 'recipe.alloy.unit.mb' });
  const format = (value: number) =>
    value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const formatPercent = (value: number) =>
    value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  const totalInvalid =
    total.trim() !== '' && (!Number.isFinite(totalNumber) || totalNumber <= 0);
  const mixLabel = recipe.components
    .map(
      ({ slot }, i) =>
        `${formatPercent(mix.rows[i]?.percent ?? 0)}% ${name(slot.id)}`,
    )
    .join(', ');
  const copyText = `${recipe.components
    .map(({ slot }, i) => `${name(slot.id)} ${format(amounts[i] || 0)}`)
    .join(' + ')} → ${output ? name(output.id) : t('Alloy', { note: 'recipe.alloy.result' })} ${format(
    mix.output,
  )} ${unitLabel}`;
  const fill = (target: number) => {
    const next = suggestAmounts(recipe.components, target);
    if (next) {
      setInputs(next.map((value) => trim(value)));
    }
  };

  const applyTotal = (raw: string) => {
    setTotal(raw);
    const value = num(raw);
    if (!Number.isFinite(value) || value <= 0) return;
    const next =
      scaleAmounts(amounts, value) ?? suggestAmounts(recipe.components, value);
    if (next) {
      setInputs(next.map((v) => trim(v)));
    }
  };
  const stepInput = (index: number, dir: 1 | -1) => {
    setInputs((prev) =>
      prev.map((value, j) =>
        j === index ? trim(Math.max(0, (num(value) || 0) + dir * step)) : value,
      ),
    );
  };
  const switchUnit = (next: 'mb' | 'ingot') => {
    if (next === unit) return;
    const k = next === 'ingot' ? 1 / INGOT_MB : INGOT_MB;
    const convert = (value: string) =>
      value.trim() !== '' && Number.isFinite(num(value))
        ? trim(num(value) * k)
        : value;
    setInputs((prev) => prev.map(convert));
    setTotal(convert);
    setUnit(next);
  };
  const applyRatioMix = (mult = 1) => {
    if (!ratioMix) return;

    const perIngot = INGOT_MB / factor;
    setInputs(ratioMix.counts.map((count) => trim(count * mult * perIngot)));
    setTotal(trim(ratioMix.total * mult * perIngot));
  };

  return {
    unit,
    total,
    inputs,
    totalNumber,
    factor,
    presets,
    mix,
    fix,
    ratioMix,
    econTotal,
    needsSnap,
    snapped,
    output,
    colors,
    name,
    format,
    formatPercent,
    unitLabel,
    totalInvalid,
    mixLabel,
    copyText,
    trim,
    setInputs,
    fill,
    applyTotal,
    stepInput,
    switchUnit,
    applyRatioMix,
  };
}

export type MixState = ReturnType<typeof useMixState>;

