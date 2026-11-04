'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Maximize2,
  Settings2,
  Shrink,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { IconButton } from '@terrafirmagreg-team/ui/components/blocks/button/icon-button';
import { ButtonGroupText } from '@terrafirmagreg-team/ui/components/ui/button-group';
import { useInFloatBar } from '@terrafirmagreg-team/ui/hooks/viewer/use-in-float-bar';
import { FloatBar } from '@terrafirmagreg-team/ui/components/blocks/viewer/float-bar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@terrafirmagreg-team/ui/components/ui/popover';
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from '@terrafirmagreg-team/ui/components/ui/field';
import { Slider } from '@terrafirmagreg-team/ui/components/ui/slider';
import { Switch } from '@terrafirmagreg-team/ui/components/ui/switch';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import type {
  ExpandButtonProps,
  PagerControlsProps,
  ViewerControlsProps,
  ViewerSettingsProps,
  ViewerSliderSetting,
  ZoomControlsProps,
} from '@terrafirmagreg-team/ui/types/viewer';

export function ViewerToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="absolute right-2 top-2 z-10">
      <FloatBar>{children}</FloatBar>
    </div>
  );
}

export function ViewerZoomControls({
  onZoomIn,
  onZoomOut,
  onFit,
  fitLabel,
}: ZoomControlsProps) {
  const t = useTranslations();
  return (
    <>
      <IconButton overlay label={t('Zoom in', { note: 'ui.canvas.zoom_in' })} onClick={onZoomIn}>
        <ZoomIn className="size-3.5" />
      </IconButton>
      <IconButton overlay label={t('Zoom out', { note: 'ui.canvas.zoom_out' })} onClick={onZoomOut}>
        <ZoomOut className="size-3.5" />
      </IconButton>
      {onFit ? (
        <IconButton
          overlay
          label={fitLabel ?? t('Fit view', { note: 'ui.canvas.fit' })}
          onClick={onFit}
        >
          <Maximize2 className="size-3.5" />
        </IconButton>
      ) : null}
    </>
  );
}

export function ViewerPagerControls({
  index,
  count,
  onSelect,
}: PagerControlsProps) {
  const t = useTranslations();
  const inFloatBar = useInFloatBar();
  return (
    <>
      <IconButton
        overlay
        label={t('Previous', { note: 'ui.canvas.prev' })}
        disabled={index === 0}
        onClick={() => onSelect(index - 1)}
      >
        <ChevronLeft className="size-3.5" />
      </IconButton>
      <ButtonGroupText
        className={
          inFloatBar
            ? 'border-0 bg-transparent text-xs'
            : 'bg-float/92 text-xs backdrop-blur-md'
        }
      >
        {index + 1} / {count}
      </ButtonGroupText>
      <IconButton
        overlay
        label={t('Next', { note: 'ui.canvas.next' })}
        disabled={index === count - 1}
        onClick={() => onSelect(index + 1)}
      >
        <ChevronRight className="size-3.5" />
      </IconButton>
    </>
  );
}

export function ViewerExpandButton({ target }: ExpandButtonProps) {
  const t = useTranslations();
  const [active, setActive] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const onChange = () =>
      setActive(document.fullscreenElement === target.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [target]);

  useEffect(() => {
    const el = target.current;
    if (!fallback || !el) return;
    el.classList.add('viewer-fallback-fullscreen');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFallback(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      el.classList.remove('viewer-fallback-fullscreen');
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [fallback, target]);

  const expanded = active || fallback;
  return (
    <IconButton
      overlay
      aria-expanded={expanded}
      label={
        expanded
          ? t('Exit fullscreen', { note: 'ui.canvas.exit_fullscreen' })
          : t('Fullscreen', { note: 'ui.canvas.fullscreen' })
      }
      onClick={() => {
        const el = target.current;
        if (fallback) {
          setFallback(false);
          return;
        }
        if (!el) return;
        if (document.fullscreenElement) {
          void document.exitFullscreen();
        } else if (el.requestFullscreen) {
          void el.requestFullscreen().catch(() => setFallback(true));
        } else {
          setFallback(true);
        }
      }}
    >
      {expanded ? (
        <Shrink className="size-3.5" />
      ) : (
        <Expand className="size-3.5" />
      )}
    </IconButton>
  );
}

function ViewerSlider({
  label,
  icon,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format = String,
  disabled,
  live,
}: ViewerSliderSetting) {
  const [draft, setDraft] = useState<{ key: number; value: number }>({
    key: value,
    value,
  });
  const shown = draft.key === value ? draft.value : value;
  return (
    <Field className="gap-1.5">
      <FieldLabel className="text-xs text-muted-foreground">
        {icon}
        {label}
      </FieldLabel>
      <FieldContent className="rounded-lg bg-muted/70 px-3 py-2.5">
        <div className="flex items-center gap-3">
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
      </FieldContent>
    </Field>
  );
}

export function ViewerSettings({
  label,
  sliders,
  toggles,
}: ViewerSettingsProps) {
  if (!sliders?.length && !toggles?.length) return null;
  return (
    <Popover>
      <PopoverTrigger render={<IconButton overlay label={label} />}>
        <Settings2 className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-60 space-y-3 p-3">
        {sliders?.map((slider, index) => (
          <ViewerSlider key={index} {...slider} />
        ))}
        {toggles?.length ? (
          <FieldGroup className="gap-1.5 rounded-lg bg-muted/60 p-2">
            {toggles.map((toggle, index) => (
              <Field key={index} orientation="horizontal" className="w-auto gap-1.5">
                <Switch
                  size="sm"
                  checked={toggle.checked}
                  onCheckedChange={toggle.onChange}
                />
                {toggle.icon}
                <FieldLabel className="text-sm font-normal">
                  {toggle.label}
                </FieldLabel>
              </Field>
            ))}
          </FieldGroup>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export function ViewerControls({
  start,
  pager,
  zoom,
  expand,
  extra,
  settings,
}: ViewerControlsProps) {
  return (
    <>
      {start}
      {pager ? <ViewerPagerControls {...pager} /> : null}
      {zoom ? <ViewerZoomControls {...zoom} /> : null}
      {expand ? <ViewerExpandButton {...expand} /> : null}
      {extra}
      {settings ? <ViewerSettings {...settings} /> : null}
    </>
  );
}

