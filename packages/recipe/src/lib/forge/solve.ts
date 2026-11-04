import type { ForgeRule, ForgeRuleAction } from '@terrafirmagreg-team/recipe/types/forge';
import { FORGE_ACTIONS, forgeRulesMatch } from './actions';

const KINDS: (ForgeRuleAction | '')[] = [
  '',
  'hit',
  'draw',
  'punch',
  'bend',
  'upset',
  'shrink',
];
const HISTORIES = 343;
const STATES = 150 * HISTORIES;

export function solveForgeSteps(
  start: { work: number; last: readonly ForgeRuleAction[] },
  target: number,
  rules: readonly ForgeRule[],
): number[] | null {
  if (
    !Number.isInteger(target) ||
    target < 0 ||
    target >= 150 ||
    !Number.isInteger(start.work) ||
    start.work < 0 ||
    start.work >= 150
  ) {
    return null;
  }
  const last = [...start.last.slice(0, 3)].reverse();
  while (last.length < 3) last.push('' as ForgeRuleAction);
  const startHistory =
    KINDS.indexOf(last[0]) +
    KINDS.indexOf(last[1]) * 7 +
    KINDS.indexOf(last[2]) * 49;
  const parent = new Int32Array(STATES).fill(-1);
  const via = new Uint8Array(STATES);
  const queue = new Int32Array(STATES);
  const startState = start.work * HISTORIES + startHistory;
  queue[0] = startState;
  parent[startState] = startState;
  let end = 1;
  for (let head = 0; head < end; head++) {
    const state = queue[head];
    const work = Math.floor(state / HISTORIES);
    const history = state % HISTORIES;
    if (
      work === target &&
      forgeRulesMatch(rules, [
        KINDS[history % 7],
        KINDS[Math.floor(history / 7) % 7],
        KINDS[Math.floor(history / 49)],
      ])
    ) {
      const steps: number[] = [];
      for (
        let cursor = state;
        cursor !== startState;
        cursor = parent[cursor]
      ) {
        steps.push(via[cursor]);
      }
      return steps.reverse();
    }
    for (let i = 0; i < FORGE_ACTIONS.length; i++) {
      const action = FORGE_ACTIONS[i];
      const nextWork = work + action.delta;
      if (nextWork < 0 || nextWork >= 150) continue;
      const nextHistory = KINDS.indexOf(action.action) + (history % 49) * 7;
      const next = nextWork * HISTORIES + nextHistory;
      if (parent[next] !== -1) continue;
      parent[next] = state;
      via[next] = i;
      queue[end++] = next;
    }
  }
  return null;
}

