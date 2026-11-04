'use client';

import { useState, type ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@terrafirmagreg-team/ui/components/ui/popover';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import { Hint } from '@terrafirmagreg-team/ui/components/blocks/tooltip/hint';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@terrafirmagreg-team/ui/components/ui/field';
import { Slider } from '@terrafirmagreg-team/ui/components/ui/slider';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@terrafirmagreg-team/ui/components/ui/toggle-group';

export function ReadabilityHelp({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items?: { icon?: ReactNode; label: string; help: string }[];
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && <FieldDescription className="text-xs">{description}</FieldDescription>}
      </div>
      {items?.map((item) => (
        <div key={item.label} className="space-y-1 rounded-lg bg-muted/60 p-2.5">
          <p className="flex items-center gap-1.5 text-xs font-medium [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:shrink-0">
            {item.icon}
            {item.label}
          </p>
          <FieldDescription className="text-xs">{item.help}</FieldDescription>
        </div>
      ))}
    </div>
  );
}

export function ReadabilityField({
  label,
  icon,
  help,
  children,
}: {
  label: ReactNode;
  icon?: ReactNode;
  help?: ReactNode;
  children: ReactNode;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  return (
    <Field className="gap-1.5">
      <div className="flex items-center gap-1 [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:shrink-0">
        {icon}
        <FieldLabel className="flex-1 text-xs text-muted-foreground">{label}</FieldLabel>
        {help && (
          <Popover onOpenChange={setHelpOpen}>
            <PopoverTrigger
              render={
                <IconButton
                  variant="ghost"
                  size="icon-xs"
                  tooltip={false}
                  label={typeof label === 'string' ? label : 'Help'}
                >
                  <CircleHelp />
                </IconButton>
              }
            />
            <PopoverContent className="w-56">{help}</PopoverContent>
          </Popover>
        )}
      </div>
      <FieldContent
        className={cn(
          'rounded-lg outline-2 outline-offset-4 outline-dashed outline-transparent transition-[outline-color] duration-200',
          helpOpen && 'outline-primary',
        )}
      >
        {children}
      </FieldContent>
    </Field>
  );
}

export function ReadabilitySlider({
  label,
  icon,
  help,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format = String,
  disabled,
  live,
}: {
  label: ReactNode;
  icon?: ReactNode;
  help?: ReactNode;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
  disabled?: boolean;
  live?: boolean;
}) {
  const [draft, setDraft] = useState<{ key: number; value: number }>({ key: value, value });
  const shown = draft.key === value ? draft.value : value;
  return (
    <ReadabilityField label={label} icon={icon} help={help}>
      <div className="flex items-center gap-3 rounded-lg bg-muted/70 px-3 py-2.5">
        <Slider
          min={min}
          max={max}
          step={step}
          value={shown}
          disabled={disabled}
          className="flex-1 [&_[data-slot=slider-track]]:bg-muted-foreground/25"
          onValueChange={(next) => {
            if (live) onChange(next as number);
            else setDraft({ key: value, value: next as number });
          }}
          onValueCommitted={() => {
            if (!live && shown !== value) onChange(shown);
          }}
        />
        <span className="w-9 shrink-0 text-end text-xs tabular-nums text-muted-foreground">
          {format(shown)}
        </span>
      </div>
    </ReadabilityField>
  );
}

export function Segment<T extends string>({
  options,
  value,
  onChange,
  disabled,
  itemContent,
  itemLabel,
  itemHelp,
  itemClassName,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  itemContent: (id: T) => ReactNode;
  itemLabel: (id: T) => string;
  itemHelp: (id: T) => string;
  itemClassName?: string;
}) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        const next = values.at(-1) as T | undefined;
        if (next && next !== value) onChange(next);
      }}
      disabled={disabled}
      size="sm"
      spacing={1}
      className="w-full rounded-lg bg-muted/70 p-1"
    >
      {options.map((id) => (
        <Hint key={id} label={itemHelp(id)}>
          <ToggleGroupItem
            value={id}
            aria-label={itemLabel(id)}
            className={cn(
              'flex-1 rounded-md text-muted-foreground hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm',
              itemClassName,
            )}
          >
            {itemContent(id)}
          </ToggleGroupItem>
        </Hint>
      ))}
    </ToggleGroup>
  );
}

export function WidthField({
  field,
  icon,
  value,
  onChange,
}: {
  field: 'page_width' | 'content_width';
  icon: ReactNode;
  value: number;
  onChange: (value: number) => void;
}) {
  const t = useTranslations();
  const w = {
    page_width: {
      label: t('Page width', { note: 'ui.readability.page_width' }),
      help: t('Adjust the maximum width of the page layout to fit different reading needs and screens', { note: 'ui.readability.page_width.help' }),
      slider: t('Page width slider', { note: 'ui.readability.page_width.slider' }),
      sliderHelp: t('A ranged slider to choose the maximum width of the page layout', { note: 'ui.readability.page_width.slider.help' }),
    },
    content_width: {
      label: t('Content width', { note: 'ui.readability.content_width' }),
      help: t('Adjust the maximum width of the text column to fit different reading needs and screens', { note: 'ui.readability.content_width.help' }),
      slider: t('Content width slider', { note: 'ui.readability.content_width.slider' }),
      sliderHelp: t('A ranged slider to choose the maximum width of the content column', { note: 'ui.readability.content_width.slider.help' }),
    },
  }[field];
  return (
    <ReadabilitySlider
      live
      label={w.label}
      icon={icon}
      help={
        <ReadabilityHelp
          title={w.label}
          description={w.help}
          items={[{ icon, label: w.slider, help: w.sliderHelp }]}
        />
      }
      value={value}
      onChange={onChange}
      min={60}
      max={100}
      step={1}
      format={(v) => `${v}%`}
    />
  );
}

