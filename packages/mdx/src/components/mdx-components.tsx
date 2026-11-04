import {
  Tab,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@terrafirmagreg-team/ui/components/mdx/tabs';
import {
  Accordion,
  Accordions,
} from '@terrafirmagreg-team/ui/components/mdx/accordion';
import { Step, Steps } from '@terrafirmagreg-team/ui/components/mdx/steps';
import {
  File,
  Folder,
  Files,
} from '@terrafirmagreg-team/ui/components/mdx/files';
import { ImageZoom } from '@terrafirmagreg-team/ui/components/mdx/image-zoom';
import { Banner } from '@terrafirmagreg-team/ui/components/mdx/banner';
import { TypeTable } from '@terrafirmagreg-team/ui/components/mdx/type-table';
import { Card, Cards } from '@terrafirmagreg-team/ui/components/mdx/card';
import { Table } from '@terrafirmagreg-team/ui/components/mdx/table';
import {
  CalloutDescription,
  CalloutTitle,
} from '@terrafirmagreg-team/ui/components/mdx/callout';
import {
  CodeBlock,
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
  Pre,
} from '@terrafirmagreg-team/ui/components/mdx/codeblock';
import { Heading } from '@terrafirmagreg-team/ui/components/blocks/page/heading';
import * as Twoslash from 'fumadocs-twoslash/ui';
import { Mermaid } from '@terrafirmagreg-team/ui/components/mdx/mermaid';
import { Callout, CalloutContainer } from '@terrafirmagreg-team/ui/components/mdx/callout';
import { Input, Output, Preview } from '@terrafirmagreg-team/ui/components/mdx/preview';
import { DocsImage } from './docs-image';
import { Multiblock } from '@terrafirmagreg-team/ui/components/mdx/multiblock';
import { GradientText } from '@terrafirmagreg-team/ui/components/mdx/gradient-text';
import { GlowHeader } from '@terrafirmagreg-team/ui/components/mdx/glow-header';
import { Icon } from '@terrafirmagreg-team/ui/components/mdx/icon';
import { LinkPreview } from '@terrafirmagreg-team/ui/components/blocks/link/link-preview';
import type { MDXComponents } from 'mdx/types';
import type { ComponentProps, HTMLAttributes } from 'react';

const extras: MDXComponents = {};

export function registerMdxComponents(map: MDXComponents): void {
  Object.assign(extras, map);
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    CodeBlockTab,
    CodeBlockTabs,
    CodeBlockTabsList,
    CodeBlockTabsTrigger,
    Tab,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    ...Twoslash,
    Accordion,
    Accordions,
    Step,
    Steps,
    File,
    Folder,
    Files,
    Mermaid,
    Banner,
    TypeTable,
    Card,
    Cards,
    Callout,
    CalloutContainer,
    CalloutTitle,
    CalloutDescription,
    Preview,
    Input,
    Output,
    DocsImage,
    Multiblock,
    GradientText,
    GlowHeader,
    Icon,
    a: LinkPreview,
    pre: (props: HTMLAttributes<HTMLPreElement>) => (
      <CodeBlock {...props}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
    h1: (props: HTMLAttributes<HTMLHeadingElement>) => (
      <Heading as="h1" {...props} />
    ),
    h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
      <Heading as="h2" {...props} />
    ),
    h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
      <Heading as="h3" {...props} />
    ),
    h4: (props: HTMLAttributes<HTMLHeadingElement>) => (
      <Heading as="h4" {...props} />
    ),
    h5: (props: HTMLAttributes<HTMLHeadingElement>) => (
      <Heading as="h5" {...props} />
    ),
    h6: (props: HTMLAttributes<HTMLHeadingElement>) => (
      <Heading as="h6" {...props} />
    ),
    table: Table,
    img: (props: ComponentProps<'img'>) => {
      const src =
        typeof props.src === 'object' && props.src !== null
          ? ((props.src as { src?: string }).src ?? '')
          : props.src;
      if (typeof src !== 'string' || /^https?:\/\//i.test(src)) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} src={src} alt={props.alt ?? ''} />;
      }
      const width = Number(props.width) || undefined;
      const height = Number(props.height) || undefined;
      return (
        <ImageZoom
          src={src}
          alt={props.alt ?? ''}
          width={width ?? 960}
          height={height ?? 540}
          sizes={props.sizes as string | undefined}
          className={props.className}
        >
          {width === undefined || height === undefined ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={props.alt ?? ''}
              width={width}
              height={height}
              className={props.className}
              style={{ width: width ?? 'auto', height: height ?? 'auto' }}
            />
          ) : undefined}
        </ImageZoom>
      );
    },
    ...extras,
    ...components,
  } as MDXComponents;
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}

