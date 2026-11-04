'use client';
import NextLink from 'next/link';
import type { ComponentProps } from 'react';
import { hrefWithLang } from '@terrafirmagreg-team/translate/lib/url';
import {
  useDefaultLang,
  useResolvedLang,
} from '@terrafirmagreg-team/translate/hooks/use-resolved-lang';

export function LangLink({
  href,
  ...props
}: ComponentProps<'a'> & { prefetch?: boolean }) {
  const lang = useResolvedLang();
  const defaultLang = useDefaultLang();
  const nextHref =
    typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')
      ? hrefWithLang(href, lang, defaultLang)
      : href;

  return <NextLink href={nextHref ?? href ?? '#'} {...props} />;
}

