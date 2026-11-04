import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z, type ZodRawShape } from 'zod';

export function sectionDocsConfig(schemaFields: ZodRawShape = {}): {
  docs: {
    schema: ReturnType<typeof pageSchema.extend>;
    postprocess: { includeProcessedMarkdown: true };
  };
  meta: { schema: typeof metaSchema };
} {
  return {
    docs: {
      schema: pageSchema.extend({
        order: z.number().optional(),
        unlisted: z.boolean().optional(),
        comments: z.boolean().optional(),
        redirect: z.string().optional(),
        defaultOpen: z.boolean().optional(),
        collapsible: z.boolean().optional(),
        link: z.boolean().optional(),
        ...schemaFields,
      }),
      postprocess: {
        includeProcessedMarkdown: true,
      },
    },
    meta: {
      schema: metaSchema,
    },
  };
}

