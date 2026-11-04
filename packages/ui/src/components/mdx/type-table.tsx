'use client';

import { ChevronDown } from 'lucide-react';
import { useUiComponents } from '@terrafirmagreg-team/ui/provider';
import { cva } from 'class-variance-authority';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { type ComponentProps, type ReactNode, useEffect, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';

export interface ParameterNode {
  name: string;
  description: ReactNode;
}

export interface TypeNode {

  description?: ReactNode;

  type: ReactNode;

  typeDescription?: ReactNode;

  typeDescriptionLink?: string;

  default?: ReactNode;

  required?: boolean;
  deprecated?: boolean;

  parameters?: ParameterNode[];

  returns?: ReactNode;
}

const fieldVariants = cva('text-muted-foreground not-prose pe-2');

export function TypeTable({
  id,
  type,
  className,
  ...props
}: { type: Record<string, TypeNode> } & ComponentProps<'div'>) {
  const t = useTranslations();

  return (
    <div
      id={id}
      className={cn(
        '@container flex flex-col p-1 bg-card text-card-foreground rounded-2xl border my-6 text-sm overflow-hidden',
        className,
      )}
      {...props}
    >
      <div className="flex font-medium items-center px-3 py-1 not-prose text-muted-foreground">
        <p className="w-1/4">{t('Prop', { note: 'ui.prop' })}</p>
        <p className="@max-xl:hidden">{t('Type', { note: 'ui.type' })}</p>
      </div>
      {Object.entries(type).map(([key, value]) => (
        <Item key={key} parentId={id} name={key} item={value} />
      ))}
    </div>
  );
}

function Item({
  parentId,
  name,
  item: {
    parameters = [],
    description,
    required = false,
    deprecated,
    typeDescription,
    default: defaultValue,
    type,
    typeDescriptionLink,
    returns,
  },
}: {
  parentId?: string;
  name: string;
  item: TypeNode;
}) {
  const t = useTranslations();
  const { Link } = useUiComponents();
  const [open, setOpen] = useState(false);
  const id = parentId ? `${parentId}-${name}` : undefined;

  useEffect(() => {
    const hash = window.location.hash;
    if (!id || !hash) return;
    if (`#${id}` === hash) setOpen(true);
  }, [id]);

  return (
    <Collapsible
      id={id}
      open={open}
      onOpenChange={(v) => {
        if (v && id) {
          window.history.replaceState(null, '', `#${id}`);
        }
        setOpen(v);
      }}
      className={cn(
        'rounded-xl border overflow-hidden scroll-m-20 transition-all',
        open ? 'shadow-sm bg-background not-last:mb-2' : 'border-transparent',
      )}
    >
      <CollapsibleTrigger className="relative flex flex-row items-center w-full group text-start px-3 py-2 not-prose hover:bg-accent">
        <code
          className={cn(
            'text-primary min-w-fit w-1/4 font-mono font-medium pe-2',
            deprecated && 'line-through text-primary/50',
          )}
        >
          {name}
          {!required && '?'}
        </code>
        {typeDescriptionLink ? (
          <Link href={typeDescriptionLink} className="underline @max-xl:hidden">
            {type}
          </Link>
        ) : (
          <span className="@max-xl:hidden">{type}</span>
        )}
        <ChevronDown className="absolute inset-e-2 size-4 text-muted-foreground transition-transform group-data-[open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-[1fr_3fr] gap-y-4 text-sm p-3 overflow-auto scroll-container border-t">
          <div className="prose prose-sm col-span-full prose-no-margin empty:hidden">
            {description}
          </div>
          {typeDescription && (
            <>
              <p className={cn(fieldVariants())}>{t('Type', { note: 'ui.type' })}</p>
              <p className="my-auto not-prose">{typeDescription}</p>
            </>
          )}
          {defaultValue && (
            <>
              <p className={cn(fieldVariants())}>{t('Default', { note: 'ui.default' })}</p>
              <p className="my-auto not-prose">{defaultValue}</p>
            </>
          )}
          {parameters.length > 0 && (
            <>
              <p className={cn(fieldVariants())}>{t('Parameters', { note: 'ui.parameters' })}</p>
              <div className="flex flex-col gap-2">
                {parameters.map((param) => (
                  <div key={param.name} className="inline-flex items-center flex-wrap gap-1">
                    <p className="font-medium not-prose text-nowrap">{param.name} -</p>
                    <div className="prose prose-sm prose-no-margin">{param.description}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {returns && (
            <>
              <p className={cn(fieldVariants())}>{t('Returns', { note: 'ui.returns' })}</p>
              <div className="my-auto prose prose-sm prose-no-margin">{returns}</div>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

