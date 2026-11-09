'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@terrafirmagreg-team/ui/components/ui/dropdown-menu';
import { CheckIcon, ChevronsUpDown } from 'lucide-react';
import {
  type HTMLAttributes,
  type ReactNode,
  useMemo,
  useState,
} from 'react';
import { useUiComponents } from '@terrafirmagreg-team/ui/provider';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { useCloseOnScroll } from '@terrafirmagreg-team/ui/hooks/use-close-on-scroll';
import { useMarquee } from '@terrafirmagreg-team/ui/hooks/use-marquee';
import type { SwitcherOption, SwitcherProps } from '@terrafirmagreg-team/ui/types/nav';

function SwitcherIcon({
  icon,
  title,
  className,
}: {
  icon?: ReactNode;
  title?: ReactNode;
  className?: string;
}) {
  const letter = typeof title === 'string' ? title.charAt(0) : null;
  return (
    <span
      className={cn(
        'flex items-center justify-center shrink-0 size-4 font-medium',
        !icon && letter != null &&
          'rounded bg-muted text-2xs text-muted-foreground',
        className,
      )}
    >
      {icon ?? letter}
    </span>
  );
}

function SwitcherItemContent({
  item,
  selected,
}: {
  item: SwitcherOption;
  selected?: string;
}) {
  return (
    <>
      <SwitcherIcon icon={item.icon} title={item.title} />
      <span className="flex flex-col flex-1 min-w-0">
        <Marquee className="font-medium">{item.title}</Marquee>
        {item.description != null && (
          <Marquee className="text-xs text-muted-foreground">
            {item.description}
          </Marquee>
        )}
      </span>
      {item.value === selected && (
        <CheckIcon className="text-primary" />
      )}
    </>
  );
}

const itemClassName = 'min-h-9 gap-3 px-2.5 py-2';

export function Switcher({
  options,
  selected,
  onSelect,
  placeholder,
  icon,
  header,
  side = 'bottom',
  disabled,
  className,
  ...props
}: SwitcherProps) {
  const [open, setOpen] = useState(false);
  const { Link } = useUiComponents();
  useCloseOnScroll(open, () => setOpen(false));

  const current = useMemo(
    () => options.find((option) => option.value === selected),
    [options, selected],
  );

  const items = useMemo(
    () =>
      options.map((item) =>
        item.url ? (
          <DropdownMenuItem
            key={item.value}
            closeOnClick
            disabled={item.disabled}
            render={<Link href={item.url} />}
            className={itemClassName}
          >
            <SwitcherItemContent item={item} selected={selected} />
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            key={item.value}
            closeOnClick
            disabled={item.disabled}
            onClick={() => onSelect?.(item.value)}
            className={itemClassName}
          >
            <SwitcherItemContent item={item} selected={selected} />
          </DropdownMenuItem>
        ),
      ),
    [options, selected, onSelect, Link],
  );

  const triggerIcon = icon ?? current?.icon;
  const triggerClassName = cn(
    'flex w-full h-10 items-center gap-3 rounded-xl border bg-secondary/50 ps-[calc(--spacing(2.5)_-_1px)] pe-2.5 text-start font-medium outline-none transition-colors [&_svg]:size-4 [&_svg]:shrink-0',
    className,
  );

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={cn(triggerClassName, 'cursor-not-allowed opacity-50')}
        {...props}
      >
        <SwitcherIcon icon={triggerIcon} title={current?.title ?? placeholder} />
        <span className="flex-1 truncate text-muted-foreground">
          {current?.title ?? placeholder}
        </span>
        <ChevronsUpDown className="!size-3.5 text-muted-foreground" />
      </button>
    );
  }

  if (options.length === 0) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger
        className={cn(
          triggerClassName,
          'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-accent',
        )}
        {...props}
      >
        <SwitcherIcon icon={triggerIcon} title={current?.title} />
        <Marquee
          className={cn('flex-1', !current && 'text-muted-foreground')}
        >
          {current ? current.title : placeholder}
        </Marquee>
        <ChevronsUpDown className="!size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align="start"
        sideOffset={8}
        alignOffset={-4}
        className="max-h-[min(--spacing(72),var(--available-height))] w-[calc(var(--anchor-width)+--spacing(2))] rounded-2xl"
      >
        {header != null ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>{header}</DropdownMenuLabel>
            {items}
          </DropdownMenuGroup>
        ) : (
          items
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { SwitcherOption, SwitcherProps } from '@terrafirmagreg-team/ui/types/nav';

function Marquee({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  const ref = useMarquee<HTMLSpanElement>();
  return (
    <span
      ref={ref}
      className={cn('block min-w-0 overflow-hidden', className)}
      {...props}
    >
      <span className="marquee-inner block whitespace-nowrap">
        {children}
      </span>
    </span>
  );
}

