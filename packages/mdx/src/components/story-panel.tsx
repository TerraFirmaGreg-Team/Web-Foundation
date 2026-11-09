'use client';

import {
  StoryProvider,
  useStory,
  useStoryArgs,
  type WithControlProps,
} from '@fumadocs/story';
import { useDataEngine } from '@fumari/stf';
import { PinnedContext, StoryFields, usePinned } from './story-fields';
import { directiveMeta, remarkFor, tweakControls } from '../lib/story-remark';
import { highlightRemark } from '../lib/remark-highlight';
import { useCopyButton } from '@terrafirmagreg-team/ui/hooks/use-copy-button';
import { Check, Clipboard } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@terrafirmagreg-team/ui/components/ui/select';
import {
  Component,
  createElement,
  useMemo,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  RotateCcw,
} from 'lucide-react';

function RemarkHint() {
  const { displayName, preset, variant } = useStory();
  const args = useStoryArgs();
  const suppressed =
    directiveMeta(displayName ?? '')?.remark === false;
  const text = useMemo(
    () =>
      suppressed
        ? ''
        : remarkFor(displayName ?? 'component', args, preset?.controls, variant),
    [suppressed, displayName, args, preset, variant],
  );
  const tokens = useMemo(() => highlightRemark(text), [text]);
  const { checked, onClick } = useCopyButton(() =>
    navigator.clipboard.writeText(text),
  );
  if (suppressed) return null;
  return (
    <div className="relative border-t">
      <pre className="overflow-x-auto px-4 py-2.5 pe-9 font-mono text-xs leading-relaxed text-fd-muted-foreground whitespace-pre-wrap">
        {tokens.map((t, i) => (
          <span key={i} className={t.cls}>
            {t.text}
          </span>
        ))}
      </pre>
      <button
        type="button"
        aria-label="Copy markdown"
        title="Copy markdown"
        onClick={onClick}
        className="absolute top-1.5 right-1.5 rounded-md p-1.5 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
      >
        {checked ? (
          <Check className="size-3.5" />
        ) : (
          <Clipboard className="size-3.5" />
        )}
      </button>
    </div>
  );
}

class PreviewBoundary extends Component<
  { children: ReactNode; resetKey: unknown },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }
  componentDidUpdate(prev: { resetKey: unknown }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error)
      this.setState({ error: null });
  }
  render() {
    if (this.state.error)
      return (
        <div role="alert" className="flex items-center gap-2 text-sm">
          <CircleAlert className="size-3.5 shrink-0 text-fd-error" />
          <span className="font-mono text-xs break-all text-fd-muted-foreground">
            {this.state.error.message}
          </span>
        </div>
      );
    return this.props.children;
  }
}

function useApplyVariant() {
  const { setVariant } = useStory();
  const engine = useDataEngine();
  const pinned = usePinned();
  return (value: string) => {
    const keep = new Map(
      [...(pinned?.pinned ?? [])].map(
        (name) =>
          [name, (engine.getData() as Record<string, unknown>)[name]] as const,
      ),
    );
    setVariant(value);
    for (const [name, value] of keep) {
      if (value === undefined) engine.delete([name]);
      else if (!engine.update([name], value)) engine.init([name], value);
    }
  };
}

function VariantSelect() {
  const { presets, variant } = useStory();
  const applyVariant = useApplyVariant();
  const index = presets.findIndex((p) => p.variant === variant);
  const step = (delta: number) => {
    const next =
      presets[(index + delta + presets.length) % presets.length];
    if (next) applyVariant(next.variant);
  };
  const stepClass =
    'rounded-md p-1.5 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground';
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        aria-label="Previous variant"
        title="Previous variant"
        onClick={() => step(-1)}
        className={stepClass}
      >
        <ChevronLeft className="size-3.5" />
      </button>
      <Select value={variant} onValueChange={(v) => v && applyVariant(v)}>
        <SelectTrigger className="h-7 w-auto max-w-64 gap-1.5 border-0 bg-transparent px-2 text-xs hover:bg-fd-accent focus:ring-0 focus-visible:ring-2">
          <span className="text-fd-muted-foreground">Variant</span>
          <SelectValue className="truncate font-medium" />
        </SelectTrigger>
        <SelectContent align="end">
          {presets.map((item) => (
            <SelectItem
              key={item.variant}
              value={item.variant}
              className="text-xs"
            >
              {item.variant}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        type="button"
        aria-label="Next variant"
        title="Next variant"
        onClick={() => step(1)}
        className={stepClass}
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}

function Content() {
  const { presets, displayName, preset, variant, Component } =
    useStory();
  const applyVariant = useApplyVariant();
  const args = useStoryArgs();
  const reset = () => applyVariant(variant);
  return (
    <div className="not-prose overflow-hidden rounded-xl border bg-fd-card text-fd-card-foreground">
      {(displayName || presets.length > 1) && (
        <div className="flex h-10 items-center justify-end gap-1 border-b ps-4 pe-1.5">
          {displayName && (
            <p className="me-auto truncate font-mono text-[0.8125rem] font-medium">
              {displayName}
            </p>
          )}
          <button
            type="button"
            aria-label="Reset"
            title="Reset"
            onClick={reset}
            className="rounded-md p-1.5 text-fd-muted-foreground hover:bg-fd-accent"
          >
            <RotateCcw className="size-3.5" />
          </button>
          {presets.length > 1 && <VariantSelect />}
        </div>
      )}
      <div className="bg-fd-background p-4 not-last:border-b">
        <PreviewBoundary resetKey={args}>
          {createElement(Component, { ...args, key: variant })}
        </PreviewBoundary>
      </div>
      {preset && (
        <StoryFields
          key={variant}
          node={preset.controls}
          storyKey={displayName ?? ''}
        />
      )}
      <RemarkHint />
    </div>
  );
}

export function DocsWithControl({ presets, ...rest }: WithControlProps) {
  const tweaked = useMemo(
    () =>
      presets.map((preset) => ({
        ...preset,
        controls: tweakControls(
          rest.displayName ?? '',
          preset.controls,
          preset.defaultValues,
        ),
      })),
    [presets, rest.displayName],
  );
  const [pinned, setPinned] = useState<ReadonlySet<string>>(new Set());
  const pinApi = useMemo(
    () => ({
      pinned,
      toggle: (name: string) =>
        setPinned((prev) => {
          const next = new Set(prev);
          if (next.has(name)) next.delete(name);
          else next.add(name);
          return next;
        }),
    }),
    [pinned],
  );
  return (
    <StoryProvider {...rest} presets={tweaked}>
      <PinnedContext.Provider value={pinApi}>
        <Content />
      </PinnedContext.Provider>
    </StoryProvider>
  );
}

