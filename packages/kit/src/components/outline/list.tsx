'use client';
import { type TOCItemInfo, useTOCSelector } from '@terrafirmagreg-team/kit/components/toc/base';
import { useTOCItems } from '@terrafirmagreg-team/kit/hooks/use-toc';
import * as Base from '@terrafirmagreg-team/kit/components/toc/base';
import * as OutlineDefault from '@terrafirmagreg-team/kit/components/toc/default';
import * as OutlineClerk from '@terrafirmagreg-team/kit/components/toc/clerk';
import * as OutlineBlock from '@terrafirmagreg-team/kit/components/toc/block';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  useState,
} from 'react';
import type { OutlineStyle } from '@terrafirmagreg-team/kit/types/outline';

const variants = {
  normal: OutlineDefault,
  clerk: OutlineClerk,
  block: OutlineBlock,
};

const selectTopmost = (items: TOCItemInfo[]) =>
  items.find((item) => item.active)?.original;
const selectProgress = (items: TOCItemInfo[]) =>
  (items.findLastIndex((item) => item.active) + 1) / Math.max(1, items.length);

export function OutlineList({
  style = 'block',
  list,
  className,
  onSelect,
}: OutlineStyle & { className?: string; onSelect?: () => void }) {
  const items = useTOCItems();
  const { TOCItems, TOCItem, TOCEmpty } = variants[style];

  return (
    <Base.TOCScrollArea className={className}>
      <TOCItems {...list}>
        {items.length === 0 && <TOCEmpty />}
        {items.map((item) => (
          <TOCItem key={item.url} item={item} onClick={onSelect} />
        ))}
      </TOCItems>
    </Base.TOCScrollArea>
  );
}

export function OutlineActiveHeading({
  fallback,
  className,
  activeClassName,
}: {
  fallback: ReactNode;
  className?: string;
  activeClassName?: string;
}) {
  const items = useTOCItems();
  const active = useTOCSelector(selectTopmost);
  const [shown, setShown] = useState({ item: active, roll: 1 });
  if (shown.item !== active) {
    setShown({
      item: active,
      roll: items.indexOf(active!) >= items.indexOf(shown.item!) ? 1 : -1,
    });
  }

  return (
    <span
      className={cn('flex min-w-0 overflow-hidden', active && activeClassName, className)}
    >
      <span
        key={active?.url}
        className="truncate motion-safe:animate-roll-in"
        style={{ '--roll': shown.roll } as CSSProperties}
      >
        {active ? active.title : fallback}
      </span>
    </span>
  );
}

export function OutlineProgress({
  size = 16,
  ...props
}: ComponentProps<'svg'> & { size?: number }) {
  const value = useTOCSelector(selectProgress);
  const circle = {
    cx: size / 2,
    cy: size / 2,
    r: size / 2 - 1.5,
    fill: 'none',
    strokeWidth: 1.5,
  };
  const circumference = 2 * Math.PI * circle.r;

  return (
    <svg
      role="progressbar"
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={1}
      {...props}
    >
      <circle {...circle} className="stroke-current/25" />
      <circle
        {...circle}
        stroke="currentColor"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - value)}
        transform={`rotate(-90 ${circle.cx} ${circle.cy})`}
        className="transition-[stroke-dashoffset] duration-300"
      />
    </svg>
  );
}

