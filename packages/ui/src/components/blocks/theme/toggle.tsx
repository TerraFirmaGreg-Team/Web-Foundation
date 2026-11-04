'use client';
import type { ComponentProps } from 'react';
import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { Airplay, Moon, Sun } from 'lucide-react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';

const noop = () => () => {};

const icons = { light: Sun, dark: Moon, system: Airplay } as const;
export type ThemeToggleMode = keyof typeof icons;

export function ThemeToggle({
  value,
  onValueChange,
  modes = ['light', 'dark', 'system'],
  labels,
  className,
  buttonClassName,
  ...props
}: ComponentProps<'div'> & {
  value?: string;
  onValueChange?: (mode: ThemeToggleMode) => void;
  modes?: readonly ThemeToggleMode[];
  labels?: Partial<Record<ThemeToggleMode, string>>;
  buttonClassName?: string;
}) {
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const current = mounted ? value : undefined;
  const select = (mode: ThemeToggleMode) => {
    if (document?.startViewTransition) {
      document.startViewTransition(() => flushSync(() => onValueChange?.(mode)));
    } else {
      onValueChange?.(mode);
    }
  };
  return (
    <div
      data-theme-toggle
      className={cn(
        'inline-flex items-center rounded-full p-1 overflow-hidden *:rounded-full',
        className,
      )}
      {...props}
    >
      {modes.map((mode) => {
        const ModeIcon = icons[mode];
        const active = current === mode;
        return (
          <Hint key={mode} label={labels?.[mode] ?? mode}>
            <button
              type="button"
              aria-label={labels?.[mode] ?? mode}
              aria-pressed={active}
              className={cn(
                'size-6.5 p-1.5 text-muted-foreground',
                buttonClassName,
                active && 'bg-accent text-accent-foreground',
              )}
              onClick={() => select(mode)}
            >
              <ModeIcon className="size-full" fill="currentColor" aria-hidden />
            </button>
          </Hint>
        );
      })}
    </div>
  );
}

