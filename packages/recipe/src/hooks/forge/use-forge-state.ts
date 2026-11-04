'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FORGE_ACTIONS,
  forgeRulesMatch,
} from '@terrafirmagreg-team/recipe/lib/forge/actions';
import { solveForgeSteps } from '@terrafirmagreg-team/recipe/lib/forge/solve';
import type { ForgeRecipe, ForgeRuleAction } from '@terrafirmagreg-team/recipe/types/forge';

export type ForgeStep = {
  id: string;
  action: ForgeRuleAction;
  delta: number;
  work: number;
};

function lastActions(applied: readonly number[]): ForgeRuleAction[] {
  return applied
    .slice(-3)
    .map((index) => FORGE_ACTIONS[index].action)
    .reverse();
}

function parseWork(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed < 150
    ? parsed
    : null;
}

export function useForgeState(recipe: ForgeRecipe) {
  const [startInput, setStartInput] = useState('0');
  const [targetInput, setTargetInput] = useState('');
  const [applied, setApplied] = useState<number[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [solving, setSolving] = useState(false);
  const replayTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startWork = parseWork(startInput) ?? 0;
  const target = targetInput === '' ? null : (parseWork(targetInput) ?? 0);

  const { work, steps } = useMemo(() => {
    let work = startWork;
    const steps: ForgeStep[] = [];
    for (const index of applied) {
      const action = FORGE_ACTIONS[index];
      work += action.delta;
      steps.push({ ...action, work });
    }
    return { work, steps };
  }, [startWork, applied]);
  const last = lastActions(applied);
  const finished = work === target && forgeRulesMatch(recipe.rules, last);

  useEffect(
    () => () => {
      if (replayTimer.current) clearInterval(replayTimer.current);
    },
    [],
  );

  const push = (index: number) => {
    const next = work + FORGE_ACTIONS[index].delta;
    if (next < 0 || next >= 150 || solving) return;
    setFailed(false);
    setApplied((prev) => [...prev, index]);
  };
  const solve = () => {
    if (solving) return;
    const found = solveForgeSteps(
      { work: startWork, last: [] },
      target ?? 0,
      recipe.rules,
    );
    if (!found) return setFailed(true);
    setFailed(false);
    setApplied([]);
    setExpanded(false);
    setSolving(true);
    let i = 0;
    replayTimer.current = setInterval(() => {
      const step = found[i];
      i += 1;
      if (step === undefined) {
        if (replayTimer.current) clearInterval(replayTimer.current);
        replayTimer.current = null;
        setSolving(false);
        return;
      }
      setApplied((prev) => [...prev, step]);
    }, 170);
  };

  const ruleMet = useMemo(() => {
    const last = lastActions(applied);
    return recipe.rules.map(
      (rule) => applied.length > 0 && forgeRulesMatch([rule], last),
    );
  }, [recipe, applied]);

  const setStart = (value: string | number) => {
    setStartInput(String(value));
    setApplied([]);
  };
  const setTarget = (value: string | number) => {
    setTargetInput(String(value));
    setFailed(false);
  };

  return {
    startInput,
    targetInput,
    applied,
    expanded,
    failed,
    solving,
    target,
    work,
    steps,
    last,
    finished,
    ruleMet,
    push,
    solve,
    setStart,
    setTarget,
    setTargetInput,
    setApplied,
    setExpanded,
  };
}

export type ForgeState = ReturnType<typeof useForgeState>;

