import type { ComponentType } from 'react';

export interface CommentsViewProps {
  page?: string;
}

export type CommentsView = ComponentType<CommentsViewProps>;

const store = globalThis as Record<symbol, CommentsView | undefined>;
const VIEW_KEY = Symbol.for('terrafirmagreg.config.commentsView');

export function registerCommentsView(component: CommentsView): void {
  store[VIEW_KEY] = component;
}

export function commentsView(): CommentsView | undefined {
  return store[VIEW_KEY];
}

