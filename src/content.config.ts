import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const internalNoteSchema = z.object({
  id: z.string().min(1),
  topic: z.string().min(1),
  decision: z.string().min(1),
  required: z.string().min(1),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    locale: z.enum(["en", "id"]),
    route: z.string().regex(/^\/(en|id)\/(?:[^/]+\/)*$/),
    alternateRoute: z.string().regex(/^\/(en|id)\/(?:[^/]+\/)*$/),
    title: z.string().min(1),
    description: z.string().min(1),
    eyebrow: z.string().min(1),
    heroTitle: z.string().min(1),
    heroSummary: z.string().min(1),
    internalNotes: z.array(internalNoteSchema).default([]),
  }),
});

const referenceSpecificationSchema = z.object({
  ashContent: z.string().nullable(),
  burnTime: z.string(),
  ignitionTime: z.string(),
  moisture: z.string(),
  fixedCarbon: z.string(),
  volatileMatter: z.string(),
  ashColor: z.string(),
});

const products = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/products" }),
  schema: z.object({
    locale: z.enum(["en", "id"]),
    name: z.string().min(1),
    components: z.array(z.string().min(1)).min(1),
    uses: z.array(z.string().min(1)).min(1),
    referenceOnlyNotice: z.string().min(1),
    grades: z.array(z.object({
      name: z.enum(["Platinum", "Super Premium", "Premium"]),
      specifications: referenceSpecificationSchema,
    })).length(3),
    shapes: z.array(z.object({
      name: z.string().min(1),
      sizes: z.array(z.string().min(1)).min(1),
    })).min(1),
    packaging: z.object({
      masterCartonKg: z.array(z.number().positive()).min(1),
      minimumOrder: z.string().min(1),
    }),
    internalNotes: z.array(internalNoteSchema).default([]),
  }),
});

const decisions = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/decisions" }),
  schema: z.object({
    stage: z.literal(3),
    sourceIdentity: z.string().min(1),
    items: z.array(z.object({
      id: z.string().min(1),
      sourceSection: z.string().min(1),
      status: z.enum(["withheld", "ambiguous", "pending-approval"]),
      decision: z.string().min(1),
      required: z.string().min(1),
    })).min(1),
  }),
});

export const collections = { pages, products, decisions };
