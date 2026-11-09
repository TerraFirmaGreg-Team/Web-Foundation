import type { DatasetRef } from '@terrafirmagreg-team/sites/location';
import { Fragment, type ReactNode } from 'react';
import { LinkPreview } from '@terrafirmagreg-team/ui/components/blocks/link/link-preview';
import { guideLink } from '@terrafirmagreg-team/guide/lib/reference';
import { formatGuide } from '@terrafirmagreg-team/guide/lib/display/format';
import { keybindLabels } from '@terrafirmagreg-team/guide/lib/display/format';
import { Kbd } from '@terrafirmagreg-team/ui/components/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@terrafirmagreg-team/ui/components/ui/tooltip';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { readableColor } from '@terrafirmagreg-team/ui/lib/color';
import type { GuideFormatOptions } from '@terrafirmagreg-team/guide/types';
import type { Lang } from '@terrafirmagreg-team/translate/types/locale';

const LINK_STYLE = 'text-primary underline underline-offset-2';

export function GuideText({
  text,
  dataset,
  lang,
  modId,
  bookPath,
  categoryByEntry,
  macros,
  langMap,
  keybinds,
  questLinks,
  previews,
}: {
  text: string;
  dataset?: DatasetRef;
  lang?: Lang;
  modId?: string;
  bookPath?: string;
} & Omit<GuideFormatOptions, 'dataset' | 'lang' | 'modId' | 'bookPath'>) {
  if (!text) return null;
  const nodes = formatGuide(text, {
    dataset,
    lang,
    modId,
    bookPath,
    categoryByEntry,
    macros,
    langMap,
    keybinds,
    questLinks,
    previews,
  });
  const children: ReactNode[] = [];
  for (const [index, node] of nodes.entries()) {
    let el: ReactNode = null;
    if (node.type === 'break') {
      el = <br />;
    } else if (node.type === 'keybind') {
      const { label, title } = keybindLabels(
        node.value,
        langMap ?? {},
        keybinds ?? {},
      );
      el = (
        <Tooltip>
          <TooltipTrigger render={<Kbd>{label}</Kbd>} />
          <TooltipContent>{title}</TooltipContent>
        </Tooltip>
      );
    } else if (node.type === 'command') {
      el = <code className="font-mono text-sm">{node.value}</code>;
    } else if (node.type === 'text') {
      el = node.value;
    }
    if (el === null) continue;
    if (node.type === 'text' && node.styles?.length) {
      el = (
        <span
          className={cn(
            node.styles.includes('bold') && 'font-bold',
            node.styles.includes('italic') && 'italic',
            node.styles.includes('underline') && 'underline',
            node.styles.includes('strike') && 'line-through',
          )}
        >
          {el}
        </span>
      );
    }
    if (node.type === 'text' && node.color) {
      el = <span style={{ color: readableColor(node.color) }}>{el}</span>;
    }
    if (node.type === 'text' && node.link) {
      const { href, external } = guideLink(node, {
        dataset: dataset ?? { id: '' },
        lang: lang ?? 'en_us',
        modId: modId ?? '',
        bookPath: bookPath ?? '',
        categoryByEntry: categoryByEntry ?? new Map(),
        questLinks,
      });
      el = href ? (
        <LinkPreview
          preview={previews?.[href]}
          href={href}
          variant="raw"
          className={LINK_STYLE}
          {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {el}
        </LinkPreview>
      ) : (
        el
      );
    }
    if (node.type === 'text' && node.tooltip) {
      el = (
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="cursor-help underline decoration-dotted underline-offset-4">
                {el}
              </span>
            }
          />
          <TooltipContent>{node.tooltip}</TooltipContent>
        </Tooltip>
      );
    }
    children.push(<Fragment key={index}>{el}</Fragment>);
  }
  return <>{children}</>;
}

