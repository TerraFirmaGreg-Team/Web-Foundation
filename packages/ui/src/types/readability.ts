export const readabilityLayouts = [
  'full',
  'sidebar',
  'both',
  'original',
] as const;
export type ReadabilityLayout = (typeof readabilityLayouts)[number];

export const spotlightStyles = ['under', 'aside'] as const;
export type SpotlightStyle = (typeof spotlightStyles)[number];

export type ReadabilityState = {
  layout: ReadabilityLayout;
  pageWidth: number;
  contentWidth: number;
  spotlight: boolean;
  spotlightStyle: SpotlightStyle;
};

export type ReadabilityValue = ReadabilityState & {
  coarsePointer: boolean;
  smallScreen: boolean;
  setLayout: (layout: ReadabilityLayout) => void;
  setPageWidth: (value: number) => void;
  setContentWidth: (value: number) => void;
  setSpotlight: (enabled: boolean) => void;
  setSpotlightStyle: (style: SpotlightStyle) => void;
};

