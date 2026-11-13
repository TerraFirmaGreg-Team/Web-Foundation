import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { type ReactNode } from 'react';
import { readableColor } from '@terrafirmagreg-team/ui/lib/color';
import { LinkPreview } from '@terrafirmagreg-team/ui/components/blocks/link/link-preview';
import { EntryIcon } from '@terrafirmagreg-team/game/components/entry/icon';
import { questHref } from '@terrafirmagreg-team/quest/lib/links';
import { questFromCompact } from '@terrafirmagreg-team/quest/lib/data/parse';
import {
  parseRichText,
  styleClassName,
} from '@terrafirmagreg-team/quest/lib/rich-text';
import { questTaskIconRefs } from '@terrafirmagreg-team/quest/lib/display';
import type { QuestCompactIndex } from '@terrafirmagreg-team/quest/lib/data/dto';
import type { RichTextNode } from '@terrafirmagreg-team/quest/types';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

function nodesToInline(nodes: RichTextNode[]): ReactNode {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'text':
        return (
          <span
            key={index}
            className={styleClassName(node.style)}
            style={node.style.color ? { color: readableColor(node.style.color) } : undefined}
          >
            {node.text}
          </span>
        );
      case 'link':
      case 'quest':
        return <span key={index}>{nodesToInline(node.children)}</span>;
      default: {
        const _never: never = node;
        return _never;
      }
    }
  });
}

export function renderRichInline(
  text: string,
  map: Record<string, string> = {},
): ReactNode {
  const nodes = parseRichText(text, map);
  if (!nodes.length) return text;
  const only = nodes[0];
  if (
    nodes.length === 1 &&
    only?.type === 'text' &&
    !only.style.color &&
    !styleClassName(only.style)
  ) {
    return only.text;
  }
  return (
    <span key="rich" className="min-w-0">
      {nodesToInline(nodes)}
    </span>
  );
}

export function renderQuestNodes(
  nodes: RichTextNode[],
  ctx: {
    dataset: DatasetRef;
    lang: Lang;
    index: QuestCompactIndex | null;
    version?: string;
  },
): ReactNode {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'text':
        return (
          <span
            key={index}
            className={styleClassName(node.style)}
            style={node.style.color ? { color: readableColor(node.style.color) } : undefined}
          >
            {node.text}
          </span>
        );
      case 'link':
        return (
          <LinkPreview key={index} variant="text" href={node.href}>
            {renderQuestNodes(node.children, ctx)}
          </LinkPreview>
        );
      case 'quest': {
        const row = ctx.index?.quests.find(
          (entry) => entry.id === node.questId,
        );
        const href = questHref(ctx.dataset, ctx.lang, {
          category: row?.filename,
          id: node.questId,
          version: ctx.version,
        });
        const icon = row ? questTaskIconRefs(questFromCompact(row))[0] : undefined;
        return (
          <LinkPreview key={index} variant="text" href={href}>
            <span className="inline-flex items-center gap-1 align-middle">
              {icon ? (
                <EntryIcon
                  reference={icon}
                  dataset={ctx.dataset}
                  size={16}
                  missing="item"
                />
              ) : null}
              {renderQuestNodes(node.children, ctx)}
            </span>
          </LinkPreview>
        );
      }
      default: {
        const _never: never = node;
        return _never;
      }
    }
  });
}

