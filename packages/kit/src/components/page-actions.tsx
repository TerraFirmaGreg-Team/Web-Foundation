'use client';
import { type ComponentProps } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLinkIcon,
  Languages,
  TextIcon,
} from 'lucide-react';
import { SiGithub } from '@icons-pack/react-simple-icons';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { Button } from '@terrafirmagreg-team/ui/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@terrafirmagreg-team/ui/components/ui/popover';
import { ItemRow } from '@terrafirmagreg-team/ui/components/blocks/list/row';
import { useUntranslated } from '@terrafirmagreg-team/ui/hooks/use-lang';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { useCopyButton } from '@terrafirmagreg-team/ui/hooks/use-copy-button';
import {
  openPageMarkdown,
  pageMarkdown,
} from '@terrafirmagreg-team/mdx/lib/markdown';
import type { TranslationState } from '@terrafirmagreg-team/translate/server';

function ActionButton({
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="secondary"
      size="sm"
      className={cn(
        'gap-2 border-foreground/10 hover:bg-background dark:hover:bg-accent [&_svg]:size-3.5 [&_svg]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function MarkdownCopyButton({
  getMarkdown,
  ...props
}: ComponentProps<'button'> & {
  getMarkdown: () => Promise<string>;
}) {
  const t = useTranslations();
  const { isLoading, checked, error, onClick } = useCopyButton(getMarkdown);

  return (
    <ActionButton
      disabled={isLoading}
      aria-live="polite"
      onClick={onClick}
      {...props}
    >
      {checked ? <Check /> : <Copy />}
      {props.children ??
        (error
          ? t('Failed to copy', { note: 'ui.copy_error' })
          : checked
            ? t('Copied Markdown', { note: 'ui.copied_markdown' })
            : t('Copy Markdown', { note: 'ui.copy_markdown' }))}
    </ActionButton>
  );
}

export function CopyPageMarkdown({ title }: { title: string }) {
  return (
    <MarkdownCopyButton
      getMarkdown={() =>
        pageMarkdown(document.querySelector('[data-md-root]'), title)
      }
    />
  );
}

export function CrowdinButton({ url }: { url: string }) {
  const t = useTranslations();
  return (
    <ActionButton
      nativeButton={false}
      render={<a href={url} target="_blank" rel="noreferrer" />}
    >
      <Languages />
      {t('Translate on Crowdin', { note: 'untranslated.translate' })}
    </ActionButton>
  );
}

export function UntranslatedActions({
  copied,
  crowdinUrl,
}: {
  copied?: TranslationState;
  crowdinUrl?: string;
}) {
  const missing = useUntranslated();
  if (!crowdinUrl || (!missing && !copied)) return null;
  return <CrowdinButton url={crowdinUrl} />;
}

export function ViewOptionsPopover({
  githubUrl,
  title,
  mdUrl,
  ...props
}: ComponentProps<typeof PopoverTrigger> & {
  githubUrl?: string;
  title?: string;
  mdUrl?: string;
}) {
  const t = useTranslations();
  const items = [
    githubUrl && {
      title: t('Open in GitHub', { note: 'ui.open_github' }),
      href: githubUrl,
      icon: <SiGithub color="currentColor" className="size-4" />,
    },
    (mdUrl || title !== undefined) && {
      title: t('View as Markdown', { note: 'ui.view_markdown' }),
      ...(mdUrl
        ? { href: mdUrl }
        : {
            onClick: () =>
              void openPageMarkdown(
                document.querySelector('[data-md-root]'),
                title!,
              ),
          }),
      icon: <TextIcon className="size-4" />,
    },
  ].filter((v) => !!v);
  if (!items.length) return null;

  return (
    <Popover>
      <PopoverTrigger
        {...props}
        render={
          <Button
            variant="secondary"
            size="sm"
            className="border-foreground/10 hover:bg-background dark:hover:bg-accent"
          />
        }
        className={(state) =>
          cn(
            'gap-2 data-[popup-open]:bg-accent data-[popup-open]:text-accent-foreground',
            typeof props.className === 'function' ? props.className(state) : props.className,
          )
        }
      >
        {props.children ?? t('Open', { note: 'ui.open' })}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="flex flex-col">
        {items.map((item) => (
          <ItemRow
            key={item.title}
            {...('href' in item
              ? { href: item.href, target: '_blank', rel: 'noreferrer noopener' }
              : { onClick: item.onClick })}
            media={item.icon}
            title={item.title}
            trailing={
              <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
            }
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function PageActions({
  copied,
  crowdinUrl,
  title,
  mdUrl,
  githubUrl,
}: {
  copied?: TranslationState;
  crowdinUrl?: string;
  title: string;
  mdUrl?: string;
  githubUrl?: string;
}) {
  return (
    <>
      <CopyPageMarkdown title={title} />
      <ViewOptionsPopover title={title} mdUrl={mdUrl} githubUrl={githubUrl} />
      <UntranslatedActions copied={copied} crowdinUrl={crowdinUrl} />
    </>
  );
}

