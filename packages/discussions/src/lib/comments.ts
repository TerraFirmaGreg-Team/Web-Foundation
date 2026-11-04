import type { ComponentType } from 'react';

export interface CommentsViewProps {
  page?: string;
}

export type CommentsView = ComponentType<CommentsViewProps>;

let view: CommentsView | undefined;

export function registerCommentsView(component: CommentsView): void {
  view = component;
}

export function commentsView(): CommentsView | undefined {
  return view;
}

