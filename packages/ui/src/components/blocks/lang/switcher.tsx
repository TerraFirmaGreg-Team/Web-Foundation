'use client';
import { useMemo } from 'react';
import { Languages } from 'lucide-react';
import { LangFlag } from '@terrafirmagreg-team/ui/components/blocks/lang/flag';
import { Switcher } from '@terrafirmagreg-team/ui/components/blocks/nav/switcher';
import type { SwitcherOption, SwitcherProps } from '@terrafirmagreg-team/ui/types/nav';

export type LangSwitcherLocale = string | { locale: string; name?: string };

const languageName = (lang: string): string => {
  const bcp47 = lang.replace(/_/g, '-');
  try {
    const name =
      new Intl.DisplayNames([bcp47], { type: 'language' }).of(bcp47) ?? lang;
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return lang;
  }
};

export function LangSwitcher({
  locales,
  label,
  icon,
  ...props
}: Omit<SwitcherProps, 'options' | 'header'> & {
  locales: LangSwitcherLocale[];
  label?: string;
}) {
  const options = useMemo<SwitcherOption[]>(
    () =>
      locales.map((item) => {
        const value = typeof item === 'string' ? item : item.locale;
        return {
          value,
          title:
            (typeof item === 'string' ? undefined : item.name) ??
            languageName(value),
          icon: <LangFlag locale={value} />,
        };
      }),
    [locales],
  );
  return (
    <Switcher
      options={options}
      icon={icon ?? <Languages />}
      placeholder={label}
      header={label}
      {...props}
    />
  );
}

