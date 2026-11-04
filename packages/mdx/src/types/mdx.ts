import type { ComponentProps } from 'react';

export interface MdastNode {
  type: string;
  data?: Record<string, unknown>;
  children?: MdastNode[];
  [key: string]: unknown;
}

export interface DirectiveNode extends MdastNode {
  type: 'containerDirective' | 'leafDirective' | 'textDirective';
  name: string;
  attributes?: Record<string, string | boolean | undefined>;
}

export type JsxAttributeValue =
  | string
  | boolean
  | {
      type: 'mdxJsxAttributeValueExpression';
      value: string;
      data?: { estree?: Record<string, unknown> };
    };

export interface JsxAttribute {
  type: 'mdxJsxAttribute';
  name: string;
  value: JsxAttributeValue;
}

export interface JsxElement {
  type: 'mdxJsxFlowElement';
  name: string;
  attributes: JsxAttribute[];
  children: MdastNode[];
}

export type DocsImageProps = {
  src?: string;

  pack?: string;

  mod?: string;

  path?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  caption?: string;

  defaultPack?: string;
} & Omit<ComponentProps<'img'>, 'src' | 'alt' | 'width' | 'height' | 'className'>;

export type ImageDirectiveProps = Pick<
  DocsImageProps,
  | 'src'
  | 'pack'
  | 'mod'
  | 'path'
  | 'alt'
  | 'width'
  | 'height'
  | 'caption'
  | 'className'
  | 'defaultPack'
>;

