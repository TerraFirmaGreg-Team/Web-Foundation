import type { ReactNode, RefObject } from 'react';

export type ZoomControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit?: () => void;
  fitLabel?: string;
};

export type PagerControlsProps = {
  index: number;
  count: number;
  onSelect: (index: number) => void;
};

export type ExpandButtonProps = {
  target: RefObject<HTMLElement | null>;
};

export type ViewerSliderSetting = {
  label: ReactNode;
  icon?: ReactNode;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
  disabled?: boolean;
  live?: boolean;
};

export type ViewerToggleSetting = {
  label: ReactNode;
  icon?: ReactNode;
  checked: boolean;
  onChange: (value: boolean) => void;
};

export type ViewerSettingsProps = {
  label: string;
  sliders?: ViewerSliderSetting[];
  toggles?: ViewerToggleSetting[];
};

export type ViewerControlsProps = {
  start?: ReactNode;
  pager?: PagerControlsProps;
  zoom?: ZoomControlsProps;
  expand?: ExpandButtonProps;
  extra?: ReactNode;
  settings?: ViewerSettingsProps;
};

