'use client';

import { McText } from '@terrafirmagreg-team/game/components/entry/mc-text';
import { dumpTextLines } from '@terrafirmagreg-team/dump/lib/dump/assets/lang/names';
import { sceneEntityHit } from '@terrafirmagreg-team/recipe/components/cards/card/scene';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@terrafirmagreg-team/ui/components/ui/tooltip';
import type {
  RecipeDecorWidget,
  RecipeTextWidget,
  RecipeWidget,
} from '@terrafirmagreg-team/recipe/lib/data/dto';
import type { RecipeSceneEntity } from '@terrafirmagreg-team/recipe/lib/data/scene';

export function CardWidgetTips({
  widgets,
  entities,
  margin,
  scale,
  langMap,
}: {
  widgets: RecipeWidget[];
  entities: RecipeSceneEntity[];
  margin: number;
  scale: number;
  langMap?: Record<string, string>;
}) {
  return widgets
    .filter(
      (widget): widget is RecipeDecorWidget | RecipeTextWidget =>
        (widget.type === 'widget' ||
          widget.type === 'text' ||
          widget.type === 'paragraph') &&
        ((widget.tooltip?.length ?? 0) > 0 ||
          (widget.tooltipComponents?.length ?? 0) > 0),
    )
    .map((widget, index) => {
      const panel = sceneEntityHit(entities, widget);
      const hit = panel
        ? {
            left: (widget.x + widget.w - 10 + margin) * scale,
            top: (widget.y + 1 + margin) * scale,
            width: 9 * scale,
            height: 9 * scale,
          }
        : {
            left: (widget.x + margin) * scale,
            top: (widget.y + margin) * scale,
            width: widget.w * scale,
            height: widget.h * scale,
          };
      return (
        <Tooltip key={`tip:${index}`}>
          <TooltipTrigger
            render={<span className="absolute block" style={hit} />}
          />
          <TooltipContent className="flex-col items-start gap-0.5 p-3 text-sm whitespace-pre-wrap">
            {(widget.tooltipComponents?.length
              ? dumpTextLines(langMap ?? {}, widget.tooltipComponents)
              : (widget.tooltip ?? [])
            ).map((line, lineIndex) => (
              <p key={lineIndex}>
                <McText text={line} surface="dark" />
              </p>
            ))}
          </TooltipContent>
        </Tooltip>
      );
    });
}

