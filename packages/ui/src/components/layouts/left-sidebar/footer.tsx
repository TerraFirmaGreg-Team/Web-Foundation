'use client';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import {
  isValidElement,
  useRef,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { useTheme } from 'next-themes';
import { useLang } from '@terrafirmagreg-team/translate/provider';
import { useTranslations } from '@terrafirmagreg-team/translate/hooks/use-translations';
import { LangSwitcher } from '@terrafirmagreg-team/ui/components/blocks/lang/switcher';
import { ThemeToggle } from '@terrafirmagreg-team/ui/components/blocks/theme/toggle';
import { Separator } from '@terrafirmagreg-team/ui/components/ui/separator';
import type { SettingsMenuComponent } from './context';

export function LeftSidebarFooter({
  settings,
}: {
  settings?: SettingsMenuComponent;
}) {
  return (
    <>
      <LeftSidebarLanguage />
      <LeftSidebarActions settings={settings} />
    </>
  );
}

export function LeftSidebarLanguage() {
  const t = useTranslations();
  const { locale, locales, onLocaleChange } = useLang();
  if (!locales?.length) return null;
  return (
    <LangSwitcher
      locales={locales}
      selected={locale}
      onSelect={(value) => onLocaleChange?.(value)}
      label={t('Choose a language', { note: 'ui.choose_language' })}
    />
  );
}

const isThemeProps = (
  value: unknown,
): value is ComponentProps<typeof ThemeToggle> =>
  typeof value === 'object' && value !== null && !isValidElement(value);

export function LeftSidebarPlate({
  tools,
  theme,
  className,
  children,
  ...props
}: ComponentProps<'div'> & {
  tools?: ReactNode;
  theme?: ComponentProps<typeof ThemeToggle> | ReactNode;
}) {
  return (
    <div
      data-slot="left-sidebar-plate"
      className={cn(
        'flex h-10 items-center gap-0.5 rounded-xl border bg-secondary/50 px-1',
        className,
      )}
      {...props}
    >
      {children}
      {(tools != null || theme != null) && (
        <div className="ms-auto flex items-center gap-0.5">
          {tools}
          {tools != null && theme != null && (
            <Separator
              orientation="vertical"
              className="mx-1 h-5 self-center! bg-muted-foreground/30"
              aria-hidden
            />
          )}
          {isThemeProps(theme) ? <ThemeToggle {...theme} /> : theme}
        </div>
      )}
    </div>
  );
}

export function LeftSidebarActions({
  settings: SettingsMenu,
  children,
}: {
  settings?: SettingsMenuComponent;

  children?: ReactNode;
}) {
  const { theme, setTheme } = useTheme();
  const plateRef = useRef<HTMLDivElement>(null);
  return (
    <LeftSidebarPlate
      ref={plateRef}
      tools={SettingsMenu ? <SettingsMenu anchor={plateRef} /> : undefined}
      theme={{
        value: theme,
        onValueChange: setTheme,
        className: 'p-0',
        buttonClassName: 'size-7',
      }}
    >
      {children}
    </LeftSidebarPlate>
  );
}

