'use client';

import { Check, LinkIcon } from 'lucide-react';
import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { Accordion as Primitive } from '@base-ui/react/accordion';
import { ChevronRight } from 'lucide-react';
import { useCopyButton } from '@terrafirmagreg-team/ui/hooks/use-copy-button';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { mergeRefs } from '@terrafirmagreg-team/ui/lib/utils/merge-refs';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';

export function AccordionRoot({ className, ...props }: ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={(s) =>
        cn(
          'divide-y divide-border overflow-hidden rounded-lg border bg-card',
          typeof className === 'function' ? className(s) : className,
        )
      }
      {...props}
    />
  );
}

export function AccordionItem({ children, ...props }: ComponentProps<typeof Primitive.Item>) {
  return <Primitive.Item {...props}>{children}</Primitive.Item>;
}

export function AccordionHeader({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Header>) {
  return (
    <Primitive.Header
      className={(s) =>
        cn(
          'scroll-m-24 not-prose flex flex-row items-center text-card-foreground font-medium has-focus-visible:bg-accent',
          typeof className === 'function' ? className(s) : className,
        )
      }
      {...props}
    >
      {children}
    </Primitive.Header>
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      className={(s) =>
        cn(
          'group flex flex-1 items-center gap-2 px-3 py-2.5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
          typeof className === 'function' ? className(s) : className,
        )
      }
      {...props}
    >
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-panel-open:rotate-90" />
      {children}
    </Primitive.Trigger>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Panel>) {
  return (
    <Primitive.Panel
      className={(s) =>
        cn(
          'h-(--accordion-panel-height) overflow-hidden transition-[height] ease-out data-ending-style:h-0 data-starting-style:h-0',
          typeof className === 'function' ? className(s) : className,
        )
      }
      {...props}
    >
      {children}
    </Primitive.Panel>
  );
}

export function Accordions({
  ref,
  className,
  defaultValue,
  ...props
}: ComponentProps<typeof AccordionRoot>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const composedRef = mergeRefs(ref, rootRef);
  const [value, setValue] = useState<unknown[]>(defaultValue ?? []);

  useEffect(() => {
    const id = window.location.hash.substring(1);
    const element = rootRef.current;
    if (!element || id.length === 0) return;

    const selected = document.getElementById(id);
    if (!selected || !element.contains(selected)) return;
    const value = selected.getAttribute('data-accordion-value');

    if (value) setValue((prev) => [value, ...prev]);
  }, []);

  return (
    <AccordionRoot
      ref={composedRef}
      value={value}
      onValueChange={setValue}
      className={(s) =>
        cn(
          'divide-y divide-border overflow-hidden rounded-lg border bg-card',
          typeof className === 'function' ? className(s) : className,
        )
      }
      {...props}
    />
  );
}

export function Accordion({
  title,
  id,
  value = String(title),
  children,
  ...props
}: Omit<ComponentProps<typeof AccordionItem>, 'value' | 'title'> & {
  title: string | ReactNode;
  value?: string;
}) {
  return (
    <AccordionItem value={value} {...props}>
      <AccordionHeader id={id} data-accordion-value={value}>
        <AccordionTrigger>{title}</AccordionTrigger>
        {id ? <CopyButton id={id} /> : null}
      </AccordionHeader>
      <AccordionContent hiddenUntilFound>
        <div className="px-4 pb-2 text-[0.9375rem] prose-no-margin [&[hidden]:not([hidden='until-found'])]:hidden">
          {children}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function CopyButton({ id }: { id: string }) {
  const t = useTranslations();
  const { checked, onClick } = useCopyButton(() => {
    const url = new URL(window.location.href);
    url.hash = id;

    return navigator.clipboard.writeText(url.toString());
  });

  return (
    <button
      type="button"
      aria-live="polite"
      className={cn(
        buttonVariants({
          variant: 'ghost',
          className: 'text-muted-foreground me-2',
        }),
      )}
      onClick={onClick}
    >
      {checked ? <Check className="size-3.5" /> : <LinkIcon className="size-3.5" />}
      <span className="sr-only">
        {checked
          ? t('Copied Link', { note: 'ui.copied_link' })
          : t('Copy Link', { note: 'ui.copy_link' })}
      </span>
    </button>
  );
}

