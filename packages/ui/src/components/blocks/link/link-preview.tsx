'use client';
import { useContext, useState } from 'react';
import type { ComponentProps } from 'react';
import { useUiComponents } from '@terrafirmagreg-team/ui/provider';
import { Globe, SquareArrowOutUpRight } from 'lucide-react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { Skeleton } from '@terrafirmagreg-team/ui/components/ui/skeleton';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@terrafirmagreg-team/ui/components/ui/hover-card';
import {
  loadExternalMeta,
  useExternalMeta,
} from '@terrafirmagreg-team/ui/hooks/use-external-meta';
import {
  loadPagePreview,
  usePagePreview,
} from '@terrafirmagreg-team/ui/hooks/page/use-page-preview';
import {
  DEFAULT_EXTERNAL_FAVICON,
  uiConfig,
} from '@terrafirmagreg-team/ui/lib/config';
import { ResolvedLangContext } from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';

type LinkPreviewVariant = 'raw' | 'text' | 'chip';

function FaviconIcon({ href }: { href: string }) {
  const [failed, setFailed] = useState(false);
  let host = '';
  try {
    host = new URL(href).hostname;
  } catch {
    return <Globe className="size-4 shrink-0 text-muted-foreground" />;
  }
  if (failed || !host) {
    return <Globe className="size-4 shrink-0 text-muted-foreground" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={(uiConfig().externalFavicon ?? DEFAULT_EXTERNAL_FAVICON).replace('{host}', host)}
      alt=""
      className="size-4 shrink-0 rounded-sm"
      onError={() => setFailed(true)}
    />
  );
}

function externalHost(href: string): string {
  try {
    return new URL(href).hostname || href;
  } catch {
    return href;
  }
}

function ExternalAnchor({
  href,
  className,
  children,
  ...props
}: ComponentProps<'a'>) {
  const [open, setOpen] = useState(false);
  const meta = useExternalMeta(href ?? '', open);
  const host = meta?.host || externalHost(href ?? '');
  const title = meta?.title || host;
  const detail = [host && host !== title ? host : '', meta?.description]
    .filter(Boolean)
    .join(' · ');
  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger
        render={
          <a
            href={href}
            className={className}
            target="_blank"
            rel="noreferrer"
            onMouseEnter={() => void loadExternalMeta(href ?? '')}
            {...props}
          />
        }
      >
        {children}
        <SquareArrowOutUpRight className="ms-0.5 inline-block size-3 align-baseline text-muted-foreground" />
      </HoverCardTrigger>
      <HoverCardContent className="w-fit max-w-[min(18rem,90vw)]">
        <div className="flex w-full min-w-0 items-center gap-2 font-medium">
          <FaviconIcon href={href ?? ''} />
          {meta ? (
            <span className="truncate">{title}</span>
          ) : (
            <Skeleton className="h-4 w-32" />
          )}
        </div>
        {meta === null ? (
          <Skeleton className="mt-1 h-3 w-40" />
        ) : detail ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {detail}
          </p>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}

function InternalAnchor({
  href,
  className,
  children,
  ...props
}: ComponentProps<'a'>) {
  const { Link } = useUiComponents();
  const lang = useContext(ResolvedLangContext)?.lang;
  const [open, setOpen] = useState(false);
  const resolved = usePagePreview(href ?? '', open, lang);
  const PreviewIconCmp = uiConfig().pagePreviewIcon;
  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger
        render={
          <Link
            href={href ?? ''}
            className={className}
            onMouseEnter={() => void loadPagePreview(href ?? '', lang)}
            {...props}
          />
        }
      >
        {children}
      </HoverCardTrigger>
      {resolved === undefined ? null : (
        <HoverCardContent className="w-fit max-w-[min(18rem,90vw)]">
          {resolved === null ? (
            <>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1 h-3 w-40" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 font-medium">
                {resolved.icon && PreviewIconCmp ? (
                  <PreviewIconCmp icon={resolved.icon} />
                ) : null}
                <span className="truncate">{resolved.title}</span>
              </div>
              {resolved.description ? (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {resolved.description}
                </p>
              ) : null}
            </>
          )}
        </HoverCardContent>
      )}
    </HoverCard>
  );
}

export function LinkPreview({
  preview,
  href,
  className,
  variant = 'raw',
  size = 'md',
  solid,
  children,
  ...props
}: ComponentProps<'a'> & {
  preview?: PagePreviewData;
  variant?: LinkPreviewVariant;
  size?: 'sm' | 'md';
  solid?: boolean;
}) {
  const { Link } = useUiComponents();
  const PreviewIconCmp = uiConfig().pagePreviewIcon;
  const external = Boolean(href && /^(https?:|mailto:|\/\/)/i.test(href));

  if (variant === 'chip') {
    const chipClass = cn(
      buttonVariants({ variant: solid ? 'secondary' : 'outline' }),
      size === 'sm' && 'px-2 py-1.5 text-xs',
      className,
    );
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={chipClass}
          {...props}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href ?? ''} className={chipClass} {...props}>
        {children}
      </Link>
    );
  }

  const merged = cn(
    variant === 'text' && 'text-primary underline underline-offset-4',
    className,
  );

  if (!href) {
    return (
      <a className={merged} {...props}>
        {children}
      </a>
    );
  }
  if (external) {
    return (
      <ExternalAnchor href={href} className={merged} {...props}>
        {children}
      </ExternalAnchor>
    );
  }
  if (!preview?.title) {
    return (
      <InternalAnchor href={href} className={merged} {...props}>
        {children}
      </InternalAnchor>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger render={<Link href={href} className={merged} {...props} />}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-fit max-w-[min(18rem,90vw)]">
        <div className="flex items-center gap-2 font-medium">
          {preview.icon && PreviewIconCmp ? (
            <PreviewIconCmp icon={preview.icon} />
          ) : null}
          <span className="truncate">{preview.title}</span>
        </div>
        {preview.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {preview.description}
          </p>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}

