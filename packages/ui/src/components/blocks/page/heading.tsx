'use client';
import { CopyCheckIcon, LinkIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { buttonVariants } from '@terrafirmagreg-team/ui/components/ui/button';
import { useCopyButton } from '@terrafirmagreg-team/ui/hooks/use-copy-button';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export function Heading({
  as,
  ...props
}: ComponentProps<'h1'> & { as?: HeadingTag }) {
  const As = as ?? 'h1';
  const t = useTranslations();
  const { checked: isChecked, onClick: onCopy } = useCopyButton(() => {
    if (!props.id) return;
    const url = new URL(window.location.href);
    url.hash = props.id;
    return navigator.clipboard.writeText(url.href);
  });

  if (!props.id) return <As {...props} />;
  return (
    <As
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        if (event.defaultPrevented) return;
        if ((event.target as HTMLElement).closest('a,button,input,select,textarea,[role="button"],[role="link"]'))
          return;
        window.location.hash = props.id!;
      }}
      className={cn(
        'group/heading flex cursor-pointer scroll-m-28 flex-row items-center gap-1',
        props.className,
      )}
    >
      {props.children}
      <button
        aria-live="polite"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon-xs' }),
          'not-prose shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/heading:opacity-100',
        )}
        onClick={onCopy}
      >
        {isChecked ? <CopyCheckIcon /> : <LinkIcon />}
        <span className="sr-only">
          {isChecked
            ? t('Copied Anchor Link', { note: 'ui.copied_anchor' })
            : t('Copy Anchor Link', { note: 'ui.copy_anchor' })}
        </span>
      </button>
    </As>
  );
}

