'use client';
import {
  createContext,
  use,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { PageToc } from '@terrafirmagreg-team/kit/components/toc/page';
import { Workspace } from '@terrafirmagreg-team/ui/components/layouts/workspace';
import {
  RightSidebarOutline,
  WorkspaceOutlineDropdown,
  WorkspaceOutlinePopover,
} from '@terrafirmagreg-team/kit/components/outline';
import type {
  OutlineProps,
  WorkspaceOutlinePopoverProps,
} from '@terrafirmagreg-team/kit/types/outline';
import type { TOCItemType } from 'fumadocs-core/toc';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { WorkspaceProps } from '@terrafirmagreg-team/ui/components/layouts/workspace';

export interface WorkspaceSlots {
  toc?: TOCItemType[];
  outline?: ReactNode;
  breadcrumb?: WorkspaceProps['breadcrumb'];
  pagination?: WorkspaceProps['pagination'];
  full?: boolean;
}

export interface WorkspaceViewProps extends WorkspaceSlots {
  outlineProps?: OutlineProps & { enabled?: boolean; single?: boolean };
  outlinePopover?: WorkspaceOutlinePopoverProps & { enabled?: boolean };
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export interface PageFrameProps extends WorkspaceViewProps {
  children?: ReactNode;
}

const WorkspaceSlotsContext = createContext<
  (slots: WorkspaceSlots | null) => void
>(() => {});

export function useWorkspaceSlots(
  slots: WorkspaceSlots | null,
  deps: readonly unknown[],
) {
  const set = use(WorkspaceSlotsContext);
  useEffect(() => {
    set(slots);
    return () => set(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, ...deps]);
}

export function PageFrame({
  toc = [],
  outline,
  outlineProps = {},
  outlinePopover = {},
  breadcrumb,
  pagination = {},
  full = false,
  actions,
  footer,
  className,
  children,
  ...props
}: PageFrameProps) {
  const [slots, setSlots] = useState<WorkspaceSlots | null>(null);
  const effToc = slots?.toc ?? toc;
  const effOutline = slots?.outline ?? outline;
  const effBreadcrumb = slots?.breadcrumb ?? breadcrumb;
  const effPagination = slots?.pagination ?? pagination;
  const effFull = slots?.full ?? full;
  const {
    enabled: outlineEnabledProp,
    single,
    ...oProps
  } = outlineProps;
  const outlineEnabled =
    outlineEnabledProp ?? (!effFull || (slots?.toc?.length ?? 0) > 0);
  const { enabled: popoverEnabledProp, ...pProps } = outlinePopover;
  const popoverEnabled =
    popoverEnabledProp ??
    Boolean(
      effToc.length > 0 || outlinePopover.header || outlinePopover.footer,
    );
  const hasCrumbs = (effBreadcrumb?.items?.length ?? 0) > 0;

  return (
    <WorkspaceSlotsContext value={setSlots}>
      <PageToc
        single={single}
        toc={outlineEnabled || popoverEnabled ? effToc : []}
        popover={
          popoverEnabled ? (
            <WorkspaceOutlinePopover {...pProps} />
          ) : undefined
        }
        outline={
          effOutline ??
          (outlineEnabled ? <RightSidebarOutline {...oProps} /> : undefined)
        }
      >
        <Workspace
          full={effFull}
          breadcrumb={effBreadcrumb}
          pagination={effPagination}
          actions={actions}
          footer={footer}
          className={className}
          outlineDropdown={
            popoverEnabled ? (
              <div
                className={cn(
                  'flex items-center gap-1.5 min-w-0 transition-[opacity,visibility] duration-300 motion-reduce:transition-none',
                  outlineEnabled &&
                    'invisible opacity-0 @max-5xl:visible @max-5xl:opacity-100 @max-5xl:transition-none',
                )}
              >
                {hasCrumbs && (
                  <span className="text-sm text-muted-foreground/50">/</span>
                )}
                <WorkspaceOutlineDropdown {...pProps} />
              </div>
            ) : undefined
          }
          {...props}
        >
          {children}
        </Workspace>
      </PageToc>
    </WorkspaceSlotsContext>
  );
}
