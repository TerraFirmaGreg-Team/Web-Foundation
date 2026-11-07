import type { SectionPage } from '@terrafirmagreg-team/kit/types';
import type { TranslationState } from '@terrafirmagreg-team/translate/server';
import type { ReactNode } from 'react';

export interface SectionPageContext {
  page: SectionPage;
  filePath: string;
  datasetId?: string;
  copied?: TranslationState;
  history?: boolean;
  exports?: Record<string, unknown>;
}

export interface SectionFeatures {
  fileUrl?: (filePath: string) => string;
  actionsRight?: (ctx: SectionPageContext) => ReactNode;
  wrapBody?: (body: ReactNode, ctx: SectionPageContext) => ReactNode;
  footer?: (ctx: SectionPageContext) => ReactNode;
  comments?: (ctx: SectionPageContext) => ReactNode;
}
