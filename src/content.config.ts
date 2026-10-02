import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { isKnownMediaSlot } from "./config/media-slots";

const internalNoteSchema = z.object({
  id: z.string().min(1),
  topic: z.string().min(1),
  decision: z.string().min(1),
  required: z.string().min(1),
});

const mediaSlotSchema = z.string().refine(isKnownMediaSlot, {
  message: "Unknown media slot; add it to src/config/media-slots.ts",
});

const routeLinkSchema = z.string().regex(/^\/(en|id)\/(?:[^/]+\/)*(?:#[a-z0-9-]+)?$/);

/** Copy for the composed home page; every string here is shown to buyers. */
const homeSchema = z.object({
  profile: z.object({ eyebrow: z.string().min(1), title: z.string().min(1), body: z.string().min(1) }),
  intro: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    linkLabel: z.string().min(1),
    href: routeLinkSchema,
  }),
  panels: z.object({
    title: z.string().min(1),
    items: z.array(z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      mediaId: mediaSlotSchema,
      tone: z.enum(["dark", "accent"]),
      linkLabel: z.string().min(1),
      href: routeLinkSchema,
    })).length(2),
  }),
  strengths: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    /** Three or four cards; a group of fewer than three would not read as a set. */
    items: z.array(z.object({
      icon: z.enum(["specs", "quality", "shipping"]),
      title: z.string().min(1),
      body: z.string().min(1),
      linkLabel: z.string().min(1),
      href: routeLinkSchema,
    })).min(3).max(4),
    note: z.string().min(1).optional(),
  }),
  team: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    linkLabel: z.string().min(1),
    href: routeLinkSchema,
  }),
  cta: z.object({ title: z.string().min(1), body: z.string().min(1) }),
});

/** How one h2 section of the markdown body is presented on a composed page. */
const composeSchema = z.object({
  kind: z.enum(["split", "media", "band", "centered", "steps", "grades", "table"]).default("split"),
  eyebrow: z.string().min(1).optional(),
  /** Photo for kind "media"; the section falls back to "split" until the file exists. */
  media: mediaSlotSchema.optional(),
  /** Photo on the left, text on the right. */
  reverse: z.boolean().default(false),
  /** Renders a named block of the page directly after this section. */
  attach: z.enum(["documents"]).optional(),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    locale: z.enum(["en", "id"]),
    route: z.string().regex(/^\/(en|id)\/(?:[^/]+\/)*$/),
    alternateRoute: z.string().regex(/^\/(en|id)\/(?:[^/]+\/)*$/),
    indexable: z.boolean().default(true),
    title: z.string().min(1),
    description: z.string().min(1),
    eyebrow: z.string().min(1).optional(),
    heroTitle: z.string().min(1),
    heroSummary: z.string().min(1).optional(),
    /** Photo beside the page heading. Shown only once the file exists in src/assets. */
    heroMedia: mediaSlotSchema.optional(),
    /** Link-preview image; defaults to brand/og-default. */
    ogImage: mediaSlotSchema.optional(),
    /** Renders the grade comparison and shape gallery from this product's data. */
    product: reference("products").optional(),
    /** Renders the team section from the team collection. */
    showTeam: z.boolean().default(false),
    /** Renders the inner box, master carton, and private label examples. */
    packagingExamples: z.boolean().default(false),
    /**
     * "home" renders the composed home page from `home`; the body is not used.
     * "sections" presents each h2 of the body with `compose`, using the same patterns as the home page.
     */
    layout: z.enum(["prose", "home", "sections"]).default("prose"),
    /** Hero presentation for "sections" pages: photo beside the text, photo behind it, or text only. */
    heroStyle: z.enum(["split", "backdrop", "plain"]).default("plain"),
    /** Which part of a wide hero photo stays visible when it is cropped. */
    heroFocus: z.enum(["top", "center", "bottom"]).default("center"),
    /** One entry per h2 of the body, in order; missing entries use kind "split". */
    compose: z.array(composeSchema).default([]),
    /** Shows the laboratory and surveyor logos before the closing call to action. */
    showLabLogos: z.boolean().default(false),
    /** The last h2 becomes the closing call to action with the email and WhatsApp buttons. */
    closingCta: z.boolean().default(false),
    home: homeSchema.optional(),
    internalNotes: z.array(internalNoteSchema).default([]),
  }).refine((page) => page.layout !== "home" || page.home !== undefined, {
    message: "layout: home needs a `home` block",
    path: ["home"],
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

const team = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/team" }),
  schema: z.object({
    locale: z.enum(["en", "id"]),
    order: z.number().int().positive(),
    name: z.string().min(1),
    role: z.string().min(1),
    bio: z.string().min(1),
    /** Portrait id such as "team/nama-anggota"; the card is text-only until the file exists. */
    photo: z.string().regex(/^team\/[a-z0-9]+(?:-[a-z0-9]+)*$/u).optional(),
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

export const collections = { pages, products, team, decisions };
