'use client';

import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import { FORGE_ACTIONS, forgeActionLabel } from '@terrafirmagreg-team/recipe/lib/forge/actions';
import {
  PLAN_SLOT,
  RULE_ICON,
  RULE_OVERLAY_Y,
  actionGlyphRect,
  GuiMask,
  GuiSprite,
  type GuiRect,
} from '@terrafirmagreg-team/recipe/components/views/forge/gui';
import type { ForgeRecipe } from '@terrafirmagreg-team/recipe/types/forge';
import type { ForgeState } from '@terrafirmagreg-team/recipe/hooks/forge/use-forge-state';

const RULE_TINT = {
  met: 'rgb(0,153,51)',
  pending: 'rgb(255,102,0)',
} as const;
const ruleOutline = (color: string) =>
  `drop-shadow(1px 0 0 ${color}) drop-shadow(-1px 0 0 ${color}) drop-shadow(0 1px 0 ${color}) drop-shadow(0 -1px 0 ${color})`;

const BUTTON_TILE: Record<string, GuiRect> = {
  light: { x: 53, y: 50, w: 16, h: 16 },
  medium: { x: 71, y: 50, w: 16, h: 16 },
  hard: { x: 53, y: 68, w: 16, h: 16 },
  draw: { x: 71, y: 68, w: 16, h: 16 },
  punch: { x: 89, y: 50, w: 16, h: 16 },
  bend: { x: 107, y: 50, w: 16, h: 16 },
  upset: { x: 89, y: 68, w: 16, h: 16 },
  shrink: { x: 107, y: 68, w: 16, h: 16 },
};

export function AnvilPanel({
  atlas,
  scale,
  recipe,
  state,
  langMap,
}: {
  atlas: string | undefined;
  scale: number;
  recipe: ForgeRecipe;
  state: ForgeState;
  langMap: Record<string, string>;
}) {
  const PX = (v: number) => v * scale;
  const { work, solving, last, applied, ruleMet, push } = state;
  const input = recipe.recipe.inputs[0];
  const output = recipe.recipe.outputs[0];

  return (
    <>
      {}
      {recipe.rules.slice(0, 3).map((rule, i) => {
        const rect = { x: 198, y: RULE_OVERLAY_Y[rule.order], w: 20, h: 22 };
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: PX(59 + i * 19),
              top: PX(7),
              width: PX(20),
              height: PX(22),
            }}
          >
            <GuiSprite
              gui={atlas}
              rect={rect}
              scale={scale}
              className="absolute inset-0"
            />
            {(['pending', 'met'] as const).map((state) => (
              <GuiMask
                key={state}
                gui={atlas}
                rect={rect}
                scale={scale}
                className="absolute inset-0 transition-opacity duration-200"
                style={{
                  backgroundColor: RULE_TINT[state],
                  mixBlendMode: 'multiply',
                  filter: ruleOutline(RULE_TINT[state]),
                  opacity: (state === 'met') === ruleMet[i] ? 1 : 0,
                }}
              />
            ))}
          </div>
        );
      })}
      {recipe.rules.slice(0, 3).map((rule, i) => (
        <GuiSprite
          key={i}
          gui={atlas}
          rect={RULE_ICON[rule.action]}
          scale={scale / 3.2}
          className="absolute"
          style={{
            left: PX(64 + i * 19),
            top: PX(10),
            width: PX(10),
            height: PX(10),
          }}
        />
      ))}

      {}
      {last.map((action, i) => (
        <GuiSprite
          key={`${i}-${action}-${applied.length}`}
          gui={atlas}
          rect={actionGlyphRect(action)}
          scale={scale / 3.2}
          className="absolute animate-in fade-in-0 zoom-in-50 duration-150"
          style={{
            left: PX(64 + i * 19),
            top: PX(31),
            width: PX(10),
            height: PX(10),
          }}
        />
      ))}

      {}
      <GuiSprite
        gui={atlas}
        rect={PLAN_SLOT}
        scale={scale}
        className="absolute"
        style={{ left: PX(21), top: PX(40) }}
      />
      {output ? (
        <div
          className="absolute"
          style={{
            left: PX(22),
            top: PX(41),
            width: PX(16),
            height: PX(16),
          }}
        >
          <Entry
            id={output.id}
            kind={output.kind === 'fluid' ? 'fluid' : 'item'}
            size={PX(16)}
            href={false}
            tooltip
          />
        </div>
      ) : null}

      {}
      {input ? (
        <div
          className="absolute"
          style={{
            left: PX(31),
            top: PX(68),
            width: PX(16),
            height: PX(16),
          }}
        >
          <Entry
            id={input.id}
            kind={input.kind === 'fluid' ? 'fluid' : 'item'}
            size={PX(16)}
            href={false}
            tooltip
          />
        </div>
      ) : null}

      {}
      {FORGE_ACTIONS.map((action, index) => {
        const disabled =
          solving || work + action.delta < 0 || work + action.delta >= 150;
        const [bx, by] = [BUTTON_TILE[action.id].x, BUTTON_TILE[action.id].y];
        return (
          <button
            key={action.id}
            type="button"
            disabled={disabled}
            title={`${forgeActionLabel(langMap, action.id)} (${action.delta > 0 ? '+' : ''}${action.delta})`}
            aria-label={`${forgeActionLabel(langMap, action.id)} (${action.delta > 0 ? '+' : ''}${action.delta})`}
            onClick={() => push(index)}
            className="group absolute rounded-[6px] outline-none transition-[filter,transform] duration-100 hover:brightness-110 hover:drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] focus-visible:ring-2 focus-visible:ring-ring active:scale-90 disabled:hover:brightness-100 disabled:hover:drop-shadow-none disabled:active:scale-100"
            style={{
              left: PX(bx),
              top: PX(by),
              width: PX(16),
              height: PX(16),
            }}
          >
            <GuiSprite
              gui={atlas}
              rect={BUTTON_TILE[action.id]}
              scale={scale}
              className="absolute inset-0"
            />
            <GuiSprite
              gui={atlas}
              rect={actionGlyphRect(action.id)}
              scale={scale / 2}
              className="absolute inset-0"
            />
            {disabled ? (
              <GuiMask
                gui={atlas}
                rect={BUTTON_TILE[action.id]}
                scale={scale}
                className="absolute inset-0 bg-black/50"
              />
            ) : null}
            {!atlas ? (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">
                {action.delta > 0 ? '+' : ''}
                {action.delta}
              </span>
            ) : null}
          </button>
        );
      })}
    </>
  );
}

