import type { ComponentProps, ReactNode } from 'react';
import type * as OutlineDefault from '@terrafirmagreg-team/kit/components/toc/default';
import type * as OutlineClerk from '@terrafirmagreg-team/kit/components/toc/clerk';
import type * as OutlineBlock from '@terrafirmagreg-team/kit/components/toc/block';

export type OutlineStyle =
  | { style?: 'block'; list?: OutlineBlock.TOCItemsProps }
  | { style: 'normal'; list?: OutlineDefault.TOCItemsProps }
  | { style: 'clerk'; list?: OutlineClerk.TOCItemsProps };

export type OutlineContent = {

  header?: ReactNode;

  footer?: ReactNode;
} & OutlineStyle;

export type OutlineProps = OutlineContent & {
  container?: ComponentProps<'div'>;
};

export type WorkspaceOutlineDropdownProps = OutlineContent & {
  trigger?: ComponentProps<'button'>;
  content?: ComponentProps<'div'>;
};

export type WorkspaceOutlinePopoverProps = WorkspaceOutlineDropdownProps & {
  container?: ComponentProps<'div'>;
};

