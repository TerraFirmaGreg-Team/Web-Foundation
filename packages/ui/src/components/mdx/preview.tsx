'use client';

import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { ReactNode } from 'react';

function Pane({
  kind,
  label,
  children,
  className,
}: {
  kind: 'input' | 'output';
  label?: string;
  children?: ReactNode;
  className?: string;
}) {
  const t = useTranslations();
  const text =
    label ?? (kind === 'input' ? t('Input', { note: 'ui.input' }) : t('Output', { note: 'ui.output' }));

  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={cn(
            'inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 font-mono text-2xs font-semibold uppercase tracking-wider',
            kind === 'input'
              ? 'border-border bg-secondary text-muted-foreground'
              : 'border-primary/30 bg-primary/10 text-primary',
          )}
        >
          {text}
        </span>
        <span className="h-px min-w-4 flex-1 bg-border" aria-hidden />
      </div>
      <div
        className={cn(
          kind === 'input' &&
            '[&_.codeblock]:my-0 [&_figure]:my-0 [&_pre]:my-0',
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Preview({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'dev-doc-preview my-6 space-y-5 rounded-lg border border-dashed border-border bg-transparent p-4',
        className,
      )}
    >
      {children}
    </section>
  );
}

function Input({
  children,
  label,
  className,
}: {
  children?: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <Pane kind="input" label={label} className={className}>
      {children}
    </Pane>
  );
}

function Output({
  children,
  label,
  className,
}: {
  children?: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <Pane kind="output" label={label} className={className}>
      {children}
    </Pane>
  );
}

export { Preview, Input, Output };

