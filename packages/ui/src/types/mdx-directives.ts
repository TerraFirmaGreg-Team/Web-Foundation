import type { CalloutType } from '@terrafirmagreg-team/ui/components/mdx/callout';

export type IconDirectiveProps = {
  name: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
};

export type GradientDirectiveProps = {
  from?: string;
  to?: string;
  dir?: string;
  image?: string;
  children: string;
  className?: string;
};

export type GlowDirectiveProps = {
  from?: string;
  to?: string;
  dir?: string;
  image?: string;
  gradient?: boolean;
  fade?: boolean;
  children: string;
  className?: string;
};

export type CalloutDirectiveProps = {
  type?: CalloutType;
  title?: string;
  children: string;
  className?: string;
};

export type CardDirectiveProps = {
  title?: string;
  icon?: string;
  description?: string;
  href?: string;
  external?: boolean;
  children?: string;
  className?: string;
};

export type BannerDirectiveProps = {
  id?: string;
  height?: string;
  variant?: 'rainbow' | 'normal';
  rainbowColors?: string[];
  changeLayout?: boolean;
  children?: string;
  className?: string;
};

export type TabsDirectiveProps = {
  items?: string[];
  defaultIndex?: number;
  label?: string;
  children: string;
  className?: string;
};

export type AccordionsDirectiveProps = {
  multiple?: boolean;
  defaultValue?: string | string[];
  children: string;
  className?: string;
};

export type StepsDirectiveProps = {
  children: string;
  className?: string;
};

export type FilesDirectiveProps = {
  children: string;
  className?: string;
};

export type CodeFenceMetaProps = {
  title?: string;
  lineNumbers?: boolean;
  tab?: string;
  noCopy?: boolean;
  twoslash?: boolean;
};

export type MermaidDirectiveProps = {
  chart: string;
};

export type MathDirectiveProps = {
  children: string;
  block?: boolean;
};

export type TypeTableDirectiveProps = {
  path?: string;
  name?: string;
  type?: string;
  cwd?: boolean;
};

