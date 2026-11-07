import type {
  SectionFeatures,
  SectionPageContext,
} from '../types/features.ts';
import type { ReactNode } from 'react';

export function pageFeatureNodes(
  ctx: SectionPageContext,
  features: SectionFeatures,
  body: ReactNode,
): {
  actionsRight: ReactNode;
  body: ReactNode;
  footer: ReactNode;
  comments: ReactNode;
} {
  const wrapped = features.wrapBody ? (
    features.wrapBody(body, ctx)
  ) : (
    <div data-md-root className="contents">
      {body}
    </div>
  );
  return {
    actionsRight: features.actionsRight?.(ctx),
    body: wrapped,
    footer: features.footer?.(ctx),
    comments: features.comments?.(ctx),
  };
}
