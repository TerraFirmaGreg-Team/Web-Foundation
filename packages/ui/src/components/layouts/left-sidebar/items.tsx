'use client';
import type { ComponentProps } from 'react';
import { useFolderDepth, useSidebar } from '@terrafirmagreg-team/ui/hooks/use-sidebar';
import { SidebarFolder, SidebarFolderContent as BaseFolderContent, SidebarFolderLink as BaseFolderLink, SidebarFolderTrigger as BaseFolderTrigger, SidebarItem as BaseItem } from '@terrafirmagreg-team/ui/components/blocks/sidebar';
import { Separator } from '@terrafirmagreg-team/ui/components/ui/separator';

export { SidebarFolder as LeftSidebarFolder };

export function LeftSidebarSeparator({
  orientation = 'horizontal',
  ...props
}: ComponentProps<typeof Separator>) {
  return (
    <Separator
      orientation={orientation}
      data-slot="left-sidebar-separator"
      {...props}
    />
  );
}

export function LeftSidebarItem({
  className,
  onClick,
  ...props
}: ComponentProps<typeof BaseItem>) {
  const { setOpen } = useSidebar();
  return (
    <BaseItem
      data-slot="left-sidebar-item"
      onClick={(event) => {
        setOpen(false);
        onClick?.(event);
      }}
      className={className}
      {...props}
    />
  );
}

export function LeftSidebarFolderTrigger({
  className,
  ...props
}: ComponentProps<typeof BaseFolderTrigger>) {
  return (
    <BaseFolderTrigger
      data-slot="left-sidebar-folder-trigger"
      className={className}
      {...props}
    />
  );
}

export function LeftSidebarFolderLink({
  className,
  onClick,
  ...props
}: ComponentProps<typeof BaseFolderLink>) {
  const { setOpen } = useSidebar();
  return (
    <BaseFolderLink
      data-slot="left-sidebar-folder-link"
      onClick={(event) => {
        setOpen(false);
        onClick?.(event);
      }}
      className={className}
      {...props}
    />
  );
}

export function LeftSidebarFolderContent({
  children,
  className,
  ...props
}: ComponentProps<typeof BaseFolderContent>) {
  return (
    <BaseFolderContent
      data-slot="left-sidebar-folder-content"
      className={className}
      {...props}
    >
      {children}
    </BaseFolderContent>
  );
}

export function LeftSidebarLabel({
  className,
  ...props
}: ComponentProps<'p'>) {
  const depth = useFolderDepth();
  return (
    <p
      data-slot="left-sidebar-label"
      data-nested={depth > 0 || undefined}
      className={className}
      {...props}
    />
  );
}

