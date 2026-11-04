'use client';
import { usePathname } from 'next/navigation';
import type { ComponentProps, ReactNode } from 'react';
import {
  AlignStartVertical,
  Columns2,
  Flashlight,
  FoldHorizontal,
  Layers,
  Maximize2,
  Minimize2,
  Palette,
  PanelLeft,
  Proportions,
  Settings,
  UnfoldHorizontal,
} from 'lucide-react';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useReadability } from '@terrafirmagreg-team/ui/hooks/readability/use-readability';
import { readabilityConfig } from '@terrafirmagreg-team/ui/lib/readability/config';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@terrafirmagreg-team/ui/components/ui/popover';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import {
  readabilityLayouts,
  spotlightStyles,
  type ReadabilityLayout,
  type SpotlightStyle,
} from '@terrafirmagreg-team/ui/types/readability';
import {
  ReadabilityField,
  ReadabilityHelp,
  Segment,
  WidthField,
} from './fields';

const layoutIcons: Record<ReadabilityLayout, ReactNode> = {
  full: <Maximize2 />,
  sidebar: <PanelLeft />,
  both: <Columns2 />,
  original: <Minimize2 />,
};

const styleIcons: Record<SpotlightStyle, ReactNode> = {
  under: <Layers />,
  aside: <AlignStartVertical />,
};

const switches = ['on', 'off'] as const;

export function ReadabilityMenu({
  anchor,
}: {
  anchor?: ComponentProps<typeof PopoverContent>['anchor'];
}) {
  const t = useTranslations();
  const {
    layout,
    setLayout,
    pageWidth,
    setPageWidth,
    contentWidth,
    setContentWidth,
    spotlight,
    setSpotlight,
    spotlightStyle,
    setSpotlightStyle,
    coarsePointer,
    smallScreen,
  } = useReadability();

  const layoutT: Record<ReadabilityLayout, { label: string; help: string }> = {
    full: {
      label: t('Expand all', { note: 'ui.readability.layout.full' }),
      help: t('The article takes the full panel width; the sidebar stays at the screen edge', { note: 'ui.readability.layout.full.help' }),
    },
    sidebar: {
      label: t('Adjustable page width', { note: 'ui.readability.layout.sidebar' }),
      help: t('The slider narrows the whole page block: the sidebar moves with it', { note: 'ui.readability.layout.sidebar.help' }),
    },
    both: {
      label: t('Adjustable page and content', { note: 'ui.readability.layout.both' }),
      help: t('Both sliders apply: page block width and the text column inside', { note: 'ui.readability.layout.both.help' }),
    },
    original: {
      label: t('Original width', { note: 'ui.readability.layout.original' }),
      help: t('Default centered page width', { note: 'ui.readability.layout.original.help' }),
    },
  };
  const spotlightT: Record<
    SpotlightStyle | 'on' | 'off',
    { label: string; help: string }
  > = {
    on: {
      label: t('On', { note: 'ui.readability.spotlight.on' }),
      help: t('Turn on Spotlight', { note: 'ui.readability.spotlight.on.help' }),
    },
    off: {
      label: t('Off', { note: 'ui.readability.spotlight.off' }),
      help: t('Turn off Spotlight', { note: 'ui.readability.spotlight.off.help' }),
    },
    under: {
      label: t('Under', { note: 'ui.readability.spotlight.under' }),
      help: t('A solid background under the hovered block shows where the cursor is', { note: 'ui.readability.spotlight.under.help' }),
    },
    aside: {
      label: t('Aside', { note: 'ui.readability.spotlight.aside' }),
      help: t('A solid line beside the hovered element shows where the cursor is', { note: 'ui.readability.spotlight.aside.help' }),
    },
  };

  const layoutDisabled = smallScreen;
  const pathname = usePathname();
  const spotlightDisabled =
    coarsePointer || (readabilityConfig().isSpotlightDisabled?.(pathname) ?? false);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <IconButton
            variant="ghost"
            size="icon-sm"
            tooltip={false}
            label={t('Readability', { note: 'ui.readability.menu' })}
            className="text-muted-foreground! data-[popup-open]:bg-accent! data-[popup-open]:text-accent-foreground!"
          >
            <Settings />
          </IconButton>
        }
      />
      <PopoverContent
        anchor={anchor}
        side="top"
        align="center"
        sideOffset={8}
        className="w-64 space-y-3 p-3"
      >
        <ReadabilityField
          label={t('Layout', { note: 'ui.readability.layout' })}
          icon={<Proportions />}
          help={
            <ReadabilityHelp
              title={t('Layout', { note: 'ui.readability.layout' })}
              description={
                layoutDisabled
                  ? t('Layout switch is not available on small screens', { note: 'ui.readability.layout.unavailable' })
                  : t('Adjust the site layout to fit different reading needs and screens', { note: 'ui.readability.layout.help' })
              }
              items={readabilityLayouts.map((id) => ({
                icon: layoutIcons[id],
                label: layoutT[id].label,
                help: layoutT[id].help,
              }))}
            />
          }
        >
          <Segment
            options={readabilityLayouts}
            value={layout}
            onChange={setLayout}
            disabled={layoutDisabled}
            itemContent={(id) => layoutIcons[id]}
            itemLabel={(id) => layoutT[id].label}
            itemHelp={(id) => layoutT[id].help}
          />
        </ReadabilityField>
        {(layout === 'sidebar' || layout === 'both') && !smallScreen && (
          <WidthField
            field="page_width"
            icon={<UnfoldHorizontal />}
            value={pageWidth}
            onChange={setPageWidth}
          />
        )}
        {layout === 'both' && !smallScreen && (
          <WidthField
            field="content_width"
            icon={<FoldHorizontal />}
            value={contentWidth}
            onChange={setContentWidth}
          />
        )}
        <ReadabilityField
          label={t('Spotlight', { note: 'ui.readability.spotlight' })}
          icon={<Flashlight />}
          help={
            <ReadabilityHelp
              title={t('Spotlight', { note: 'ui.readability.spotlight' })}
              description={
                spotlightDisabled
                  ? t('Spotlight is not available on touch screens', { note: 'ui.readability.spotlight.unavailable' })
                  : t('Highlight the line or block under the cursor to help readers stay focused', { note: 'ui.readability.spotlight.help' })
              }
              items={switches.map((id) => ({
                label: spotlightT[id].label,
                help: spotlightT[id].help,
              }))}
            />
          }
        >
          <Segment
            options={switches}
            value={spotlight ? 'on' : 'off'}
            onChange={(id) => setSpotlight(id === 'on')}
            disabled={spotlightDisabled}
            itemContent={(id) => spotlightT[id].label}
            itemLabel={(id) => spotlightT[id].label}
            itemHelp={(id) => spotlightT[id].help}
            itemClassName="text-xs"
          />
        </ReadabilityField>
        {spotlight && !spotlightDisabled && (
          <ReadabilityField
            label={t('Style', { note: 'ui.readability.spotlight.styles' })}
            icon={<Palette />}
            help={
              <ReadabilityHelp
                title={t('Style', { note: 'ui.readability.spotlight.styles' })}
                description={t('Adjust how the spotlight highlight is drawn', { note: 'ui.readability.spotlight.styles.help' })}
                items={spotlightStyles.map((id) => ({
                  icon: styleIcons[id],
                  label: spotlightT[id].label,
                  help: spotlightT[id].help,
                }))}
              />
            }
          >
            <Segment
              options={spotlightStyles}
              value={spotlightStyle}
              onChange={setSpotlightStyle}
              disabled={spotlightDisabled || !spotlight}
              itemContent={(id) => styleIcons[id]}
              itemLabel={(id) => spotlightT[id].label}
              itemHelp={(id) => spotlightT[id].help}
            />
          </ReadabilityField>
        )}
      </PopoverContent>
    </Popover>
  );
}

