'use client';

import { useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@terrafirmagreg-team/ui/lib/canvas/xyflow';
import type { FlowNode } from '@terrafirmagreg-team/quest/types';
import { Entry } from '@terrafirmagreg-team/game/components/entry/entry';
import {
  EntryGroup,
  GROUP_CYCLE_MS,
} from '@terrafirmagreg-team/game/components/entry/group';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { questDisplayTitle, questTaskIconRefs } from '@terrafirmagreg-team/quest/lib/display';
import { renderRichInline } from '@terrafirmagreg-team/quest/components/rich-text';
import { questIconInnerPx, questNodeOuterPx } from '@terrafirmagreg-team/quest/lib/grid';
import {
  questShapeClip,
  questShapeHasChrome,
  questShapeRadiusClass,
  resolveQuestShapeId,
} from '@terrafirmagreg-team/quest/lib/shape';
import { questTexturePublicUrl } from '@terrafirmagreg-team/quest/lib/image';
import { useFlowHoverState } from '@terrafirmagreg-team/ui/hooks/canvas/use-flow-hover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@terrafirmagreg-team/ui/components/ui/tooltip';
import { stackIdFromRef } from '@terrafirmagreg-team/dump/lib/dump/contract/ref';

const QUEST_FILL = 'var(--color-quest-fill)';
const QUEST_BACKGROUND_ALPHA = 150 / 255;
const QUEST_OUTLINE_ALPHA = 150 / 255;
const QUEST_HOVER_ALPHA = 39;

function shapeMaskStyle(url: string): React.CSSProperties {
  return {
    WebkitMaskImage: `url(${url})`,
    maskImage: `url(${url})`,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
  };
}

export function QuestNode({ data, selected }: NodeProps<FlowNode>) {
  const { id: hoverId, setId } = useFlowHoverState();
  const hovered = hoverId === data.quest.id;
  const size = questNodeOuterPx(data.quest, data.gridScale, data.questSpacing);
  const inner = questIconInnerPx(size);
  const clip = questShapeClip(data.quest.shape);
  const radius = questShapeRadiusClass(data.quest.shape);
  const hasChrome = questShapeHasChrome(data.quest.shape);
  const label = questDisplayTitle(data.quest, data.langMap);
  const icons = useMemo(() => questTaskIconRefs(data.quest), [data.quest]);
  const icon = icons.length <= 1 ? icons[0] : undefined;
  const shapeTexIds = hasChrome
    ? data.shapeTextures?.[resolveQuestShapeId(data.quest.shape) ?? '']
    : undefined;
  const shapeTex = shapeTexIds
    ? {
        shape: shapeTexIds.shape && questTexturePublicUrl(data.dataset, shapeTexIds.shape),
        background:
          shapeTexIds.background &&
          questTexturePublicUrl(data.dataset, shapeTexIds.background),
        outline:
          shapeTexIds.outline &&
          questTexturePublicUrl(data.dataset, shapeTexIds.outline),
      }
    : undefined;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            className="relative flex items-center justify-center bg-transparent"
            style={{ width: size, height: size }}
            onMouseEnter={() => setId(data.quest.id)}
            onMouseLeave={() => setId(null)}
          />
        }
      >
        <Handle
          type="source"
          position={Position.Top}
          id="edge"
          className="!h-px !w-px !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0"
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="edge"
          className="!h-px !w-px !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0"
        />
        <div
          className={cn(
            'relative flex items-center justify-center',
            hasChrome && 'overflow-hidden',
            hasChrome && !shapeTex && 'border-2',
            hasChrome && !shapeTex && radius,
            hasChrome &&
              !shapeTex &&
              (selected
                ? 'border-primary'
                : hovered
                  ? 'border-primary/60'
                  : 'border-border'),
          )}
          style={{
            width: size,
            height: size,
            clipPath: hasChrome && !shapeTex ? clip : undefined,
          }}
        >
          {shapeTex?.shape && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: QUEST_FILL,
                ...shapeMaskStyle(shapeTex.shape),
              }}
            />
          )}
          {shapeTex?.background && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shapeTex.background}
              alt=""
              className="absolute inset-0 h-full w-full"
              style={{ opacity: QUEST_BACKGROUND_ALPHA }}
            />
          )}
          {shapeTex?.outline && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shapeTex.outline}
              alt=""
              className="absolute inset-0 h-full w-full"
              style={{ opacity: QUEST_OUTLINE_ALPHA }}
            />
          )}
          {hasChrome && !shapeTex && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: QUEST_FILL }}
            />
          )}
          {hovered && shapeTex?.shape && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: `color-mix(in srgb, white ${QUEST_HOVER_ALPHA}%, transparent)`,
                ...shapeMaskStyle(shapeTex.shape),
              }}
            />
          )}
          {hovered && !shapeTex?.shape && (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: `color-mix(in srgb, white ${QUEST_HOVER_ALPHA}%, transparent)` }}
            />
          )}
          {icons.length > 1 ? (
            <EntryGroup
              members={icons}
              size={inner}
              cycle={GROUP_CYCLE_MS}
              dataset={data.dataset}
              missing="item"
            />
          ) : icon ? (
            <Entry
              reference={icon}
              name={stackIdFromRef(icon)}
              size={inner}
              href={false}
              tooltip={false}
              missing={icon.kind === 'texture' ? 'placeholder' : 'item'}
            />
          ) : null}
          {selected && shapeTex?.outline && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shapeTex.outline}
              alt=""
              className="quest-outline-pulse absolute inset-0 h-full w-full"
            />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="flex-col items-start gap-0.5">
        <span>
          {data.quest.title
            ? renderRichInline(data.quest.title, data.langMap)
            : label}
        </span>
        {data.quest.subtitle ? (
          <span className="text-xs text-muted-foreground">
            {renderRichInline(data.quest.subtitle, data.langMap)}
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

