'use client';

import {
  ArrowUp,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  Info,
  Mountain,
  Move,
  Scissors,
  Settings2,
  SquareMousePointer,
} from 'lucide-react';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@terrafirmagreg-team/ui/components/ui/popover';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';

export function CalcHelp() {
  const t = useTranslations();
  return (
    <Popover>
      <PopoverTrigger
        render={<IconButton overlay label={t('Calculator help', { note: 'recipe.calc.help.title' })} />}
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-80 space-y-3 p-3">
        <section className="space-y-1.5">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t('Nodes', { note: 'recipe.calc.help.sec_nodes' })}
          </h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <span className="size-4 rounded border border-primary/60" />
              </span>
              {t('Resolved with a recipe', { note: 'recipe.calc.help.recipe' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <span className="size-4 rounded border border-red-500/70" />
              </span>
              {t('Recipe cycle', { note: 'recipe.calc.help.cycle' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <span className="size-3.5 rounded ring-2 ring-primary/70" />
              </span>
              {t('Focused node', { note: 'recipe.calc.help.focus' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <span className="rounded border border-emerald-500/40 px-0.5 text-[10px] font-medium leading-3 text-emerald-500">
                  +N
                </span>
              </span>
              {t('Covered by another card output', { note: 'recipe.calc.help.satisfied' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <Mountain className="size-3.5 text-muted-foreground" />
              </span>
              {t('No recipe; raw material', { note: 'recipe.calc.help.source' })}
            </li>
          </ul>
        </section>
        <section className="space-y-1.5">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t('Ports', { note: 'recipe.calc.help.sec_ports' })}
          </h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <span className="size-3.5 rounded-sm border border-emerald-500" />
              </span>
              {t('Input port: click to pick a supplier or drag a wire', { note: 'recipe.calc.help.port_in' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <span className="size-3.5 rounded-sm border border-red-400" />
              </span>
              {t('Output port: click to pick a recipe or drag a wire', { note: 'recipe.calc.help.port_out' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <span className="size-3.5 rounded-sm border border-dotted border-emerald-500" />
              </span>
              {t('Catalyst: needed but not consumed; wire it or click to pick a supplier', { note: 'recipe.calc.help.port_cat' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <ChevronUp className="size-3.5 text-muted-foreground" />
              </span>
              {t('Hidden ports - scroll the rail or click the arrow', { note: 'recipe.calc.help.port_more' })}
            </li>
          </ul>
        </section>
        <section className="space-y-1.5">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t('Edges', { note: 'recipe.calc.help.sec_edges' })}
          </h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <ArrowUp className="size-3.5 text-muted-foreground" />
              </span>
              {t('Arrows flow from ingredient to product', { note: 'recipe.calc.help.edges' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <span className="h-0.5 w-4 rounded bg-teal-500" />
              </span>
              {t('Outgoing edges', { note: 'recipe.calc.help.edge_out' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <span className="h-0.5 w-4 rounded bg-yellow-500" />
              </span>
              {t('Incoming edges', { note: 'recipe.calc.help.edge_in' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <span className="h-0 w-4 border-t border-dashed border-primary/70" />
              </span>
              {t('Drag port to port to link; drag a wire end to retarget', { note: 'recipe.calc.help.edge_link' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <span className="rounded border border-border bg-background px-0.5 text-[9px] leading-3 tabular-nums">
                  16
                </span>
              </span>
              {t('Flow on a wire - shows on hover; click to cap the amount', { note: 'recipe.calc.help.edge_flow' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <Scissors className="size-3.5 text-muted-foreground" />
              </span>
              {t('Shift + hover a wire shows x - click to delete it', { note: 'recipe.calc.help.edge_cut' })}
            </li>
          </ul>
        </section>
        <section className="space-y-1.5">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t('Actions', { note: 'recipe.calc.help.sec_actions' })}
          </h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <ChevronsUpDown className="size-3.5 text-muted-foreground" />
              </span>
              {t('Recipe/tag member: open picker', { note: 'recipe.calc.help.chip' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <Eye className="size-3.5 text-muted-foreground" />
              </span>
              {t('Recipe preview', { note: 'recipe.calc.help.hover' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <SquareMousePointer className="size-3.5 text-muted-foreground" />
              </span>
              {t('Node context menu', { note: 'recipe.calc.help.ctx' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <Settings2 className="size-3.5 text-muted-foreground" />
              </span>
              {t('View modes', { note: 'recipe.calc.help.modes' })}
            </li>
            <li className="flex items-center gap-2">
              <span className="flex w-5 shrink-0 items-center justify-center">
                <Move className="size-3.5 text-muted-foreground" />
              </span>
              {t('Pan and zoom', { note: 'recipe.calc.help.nav' })}
            </li>
          </ul>
        </section>
      </PopoverContent>
    </Popover>
  );
}

