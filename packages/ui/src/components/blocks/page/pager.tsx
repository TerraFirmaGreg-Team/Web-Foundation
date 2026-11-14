'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import { SPRITE_CHIP_CLASS } from '@terrafirmagreg-team/ui/components/blocks/sprite';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@terrafirmagreg-team/ui/components/ui/pagination';
import { Progress } from '@terrafirmagreg-team/ui/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@terrafirmagreg-team/ui/components/ui/tooltip';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useElementSize } from '@terrafirmagreg-team/ui/hooks/use-element-size';
import { useSwipe } from '@terrafirmagreg-team/ui/hooks/use-swipe';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';

export function PagerArrow({
  dir,
  disabled,
  onClick,
  label,
  variant = 'secondary',
  size = 'icon-lg',
  overlay,
  className,
}: {
  dir: -1 | 1;
  disabled?: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  label?: string;
  variant?: 'outline' | 'secondary' | 'ghost';
  size?: 'icon-xs' | 'icon-sm' | 'icon-lg';
  overlay?: boolean;
  className?: string;
}) {
  const t = useTranslations();
  return (
    <IconButton
      label={
        label ??
        (dir < 0
          ? t('Previous Page', { note: 'ui.prev_page' })
          : t('Next Page', { note: 'ui.next_page' }))
      }
      tooltip={false}
      variant={variant}
      size={size}
      overlay={overlay}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'shrink-0',
        variant === 'secondary' &&
          'border-foreground/10 hover:bg-background dark:hover:bg-accent',
        className,
      )}
    >
      {dir < 0 ? (
        <ChevronLeft className="size-[58%]" />
      ) : (
        <ChevronRight className="size-[58%]" />
      )}
    </IconButton>
  );
}

export function Pager({
  page,
  pages,
  to,
  total,
  onPage,
  label,
  leading,
  loop,
  layout = 'spread',
  className,
}: {
  page: number;
  pages: number;
  to: number;
  total: number;
  onPage: (page: number) => void;
  label: string;
  leading?: ReactNode;
  loop?: boolean;
  layout?: 'spread' | 'center';
  className?: string;
}) {
  const prev = (
    <PagerArrow
      dir={-1}
      disabled={loop ? pages <= 1 : page <= 0}
      onClick={(event) => onPage(event.shiftKey ? 0 : page - 1)}
    />
  );
  const next = (
    <PagerArrow
      dir={1}
      disabled={loop ? pages <= 1 : page + 1 >= pages}
      onClick={(event) => onPage(event.shiftKey ? pages - 1 : page + 1)}
    />
  );
  const progress = (
    <Progress
      value={to}
      max={Math.max(total, 1)}
      className={cn('w-14 shrink-0 gap-0 sm:w-20', layout === 'spread' ? undefined : 'mx-1')}
    />
  );
  const counter = (
    <span
      className={cn(
        'shrink-0 tabular-nums',
        layout === 'center' ? 'text-center' : undefined,
      )}
      style={
        layout === 'center'
          ? { minWidth: `${String(pages).length * 2 + 1}ch` }
          : undefined
      }
    >
      {label
        .replaceAll('{page}', String(page + 1))
        .replaceAll('{pages}', String(pages))}
    </span>
  );

  if (layout === 'center') {
    return (
      <Pagination className={cn('mx-0 w-full', className)}>
        <PaginationContent className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2">
          <PaginationItem className="flex items-center gap-1 justify-self-start">
            {leading}
          </PaginationItem>
          <PaginationItem className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            {prev}
            {progress}
            {counter}
            {next}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }

  return (
    <Pagination className={cn('mx-0 w-full', className)}>
      <PaginationContent className="w-full justify-between gap-2">
        <PaginationItem className="flex items-center gap-1">
          {prev}
          {leading}
        </PaginationItem>
        <PaginationItem className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          {progress}
          {counter}
        </PaginationItem>
        <PaginationItem>{next}</PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

type IconPagerOption<T extends string> = {
  id: T;
  icon: ReactNode;
  help?: string;
  helpMod?: string;
};

const PAGER_CELL = 40;
const PAGER_GAP = 4;
const PAGER_ARROW = 36;

export function IconPager<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value?: T;
  options: IconPagerOption<T>[];
  onChange: (id: T) => void;
  className?: string;
}) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const { w } = useElementSize(stripRef);
  const per = Math.max(
    1,
    Math.floor((w - 2 * (PAGER_ARROW + PAGER_GAP) + PAGER_GAP) / PAGER_CELL),
  );
  const pages = Math.max(1, Math.ceil(options.length / per));
  const valueIndex = options.findIndex((option) => option.id === value);
  const autoPage = Math.max(0, Math.floor(valueIndex / per));
  const [manual, setManual] = useState<number | null>(null);
  const [lastValue, setLastValue] = useState(value);
  if (lastValue !== value) {
    setLastValue(value);
    setManual(null);
  }
  const page = Math.min(manual ?? autoPage, pages - 1);
  const shown = options.slice(page * per, (page + 1) * per);

  const go = (dir: number) => setManual((page + dir + pages) % pages);
  const swipe = useSwipe((dir) => {
    const next = valueIndex + dir;
    if (next >= 0 && next < options.length) {
      onChange(options[next]!.id);
    } else {
      go(dir);
    }
  });

  return (
    <div
      ref={stripRef}
      {...swipe}
      onWheel={(event) => {
        if (pages > 1) go(event.deltaY > 0 ? 1 : -1);
      }}
      className={cn('flex min-h-9 items-center gap-1', className)}
    >
      <PagerArrow dir={-1} disabled={pages <= 1} onClick={() => go(-1)} />
      <div
        className={cn(
          'flex min-w-0 flex-1 items-center justify-center gap-1',
          w === 0 && 'invisible',
        )}
      >
        {shown.map((option) => (
          <Tooltip key={option.id}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => onChange(option.id)}
                  aria-label={option.help ?? option.id}
                  aria-pressed={option.id === value}
                  className={cn(
                    SPRITE_CHIP_CLASS,
                    'size-9 rounded-sm p-0 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:text-foreground',
                  )}
                />
              }
            >
              {option.icon}
            </TooltipTrigger>
            {option.help ? (
              <TooltipContent>
                <span className="block">
                  <span className="block">{option.help}</span>
                  {option.helpMod ? (
                    <span
                      className="block italic"
                      style={{ color: 'var(--color-mc-enchant)' }}
                    >
                      {option.helpMod}
                    </span>
                  ) : null}
                </span>
              </TooltipContent>
            ) : null}
          </Tooltip>
        ))}
      </div>
      <PagerArrow dir={1} disabled={pages <= 1} onClick={() => go(1)} />
    </div>
  );
}

