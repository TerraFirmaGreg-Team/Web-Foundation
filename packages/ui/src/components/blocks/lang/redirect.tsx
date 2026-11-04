'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocaleRegistry } from '@terrafirmagreg-team/translate/hooks/use-locale-registry';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { resolveLang } from '@terrafirmagreg-team/translate/lib/code';
import { langFromFragment, withLang } from '@terrafirmagreg-team/translate/lib/url';

function RedirectLink({ href }: { href: string }) {
  const t = useTranslations();
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16">
      <a
        href={href}
        className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-accent-foreground"
      >
        {t('Redirecting…', { note: 'ui.redirecting' })}
      </a>
    </div>
  );
}

function Redirect({ to }: { to: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { languages, defaultLanguage } = useLocaleRegistry();
  const lang = resolveLang(
    searchParams.get('lang') ??
      (typeof window === 'undefined'
        ? undefined
        : langFromFragment(window.location.hash)),
    languages,
    defaultLanguage,
  );
  useEffect(() => {
    router.replace(withLang(to, lang, defaultLanguage));
  }, [to, router, lang, defaultLanguage]);
  return <RedirectLink href={withLang(to, lang, defaultLanguage)} />;
}

export function LangRedirect({ to }: { to: string }) {
  return (
    <Suspense fallback={<RedirectLink href={to} />}>
      <Redirect to={to} />
    </Suspense>
  );
}

