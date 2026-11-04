'use client';
import { Fragment } from 'react';
import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@terrafirmagreg-team/ui/components/ui/breadcrumb';
import { LinkPreview } from '@terrafirmagreg-team/ui/components/blocks/link/link-preview';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import type { PagePreviewData } from '@terrafirmagreg-team/ui/types/preview';

export function Breadcrumb({
  items,
  previews,
  className,
}: {
  items: Array<{ name: string; url?: string }>;
  previews?: Record<string, PagePreviewData>;
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <BreadcrumbRoot className={cn('min-w-0', className)}>
      <BreadcrumbList>
        {items.map((item, index) => (
          <Fragment key={`${item.name}:${index}`}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.url ? (
                <LinkPreview
                  href={item.url}
                  preview={item.url ? previews?.[item.url] : undefined}
                  className="truncate transition-opacity hover:opacity-80"
                >
                  {item.name}
                </LinkPreview>
              ) : (
                <BreadcrumbPage className="truncate font-medium">
                  {item.name}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
}

