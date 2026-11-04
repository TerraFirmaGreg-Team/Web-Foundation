import type { ComponentProps, ReactNode } from 'react';

export type SwitcherOption = {
  value: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  url?: string;
  disabled?: boolean;
};

export type SwitcherProps = Omit<ComponentProps<'button'>, 'onSelect'> & {
  options: SwitcherOption[];
  selected?: string;
  onSelect?: (value: string) => void;
  placeholder?: ReactNode;
  icon?: ReactNode;
  header?: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
};

export type LinkProps = ComponentProps<'a'> & {
  href?: string;
  external?: boolean;
  prefetch?: boolean;
  children?: ReactNode;
};

interface Filterable {

  on?: 'menu' | 'nav' | 'all';
}

interface WithHref {
  url: string;

  active?: 'url' | 'nested-url' | 'none';
  external?: boolean;
}

export interface MainItemType extends WithHref, Filterable {
  type?: 'main';
  icon?: ReactNode;
  text: ReactNode;
  description?: ReactNode;
}

export interface IconItemType extends WithHref, Filterable {
  type: 'icon';

  label?: string;
  icon: ReactNode;
  text: ReactNode;

  secondary?: boolean;
}

export interface ButtonItemType extends WithHref, Filterable {
  type: 'button';
  icon?: ReactNode;
  text: ReactNode;

  secondary?: boolean;
}

export interface MenuItemType extends Partial<WithHref>, Filterable {
  type: 'menu';
  icon?: ReactNode;
  text: ReactNode;
  items: (
    | (MainItemType & {

        menu?: ComponentProps<'a'> & {
          banner?: ReactNode;
        };
      })
    | CustomItemType
  )[];

  secondary?: boolean;
}

export interface CustomItemType extends Filterable {
  type: 'custom';

  secondary?: boolean;
  children: ReactNode;
}

export type LinkItemType =
  | MainItemType
  | IconItemType
  | ButtonItemType
  | MenuItemType
  | CustomItemType;

