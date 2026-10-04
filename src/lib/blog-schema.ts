import { z } from "astro/zod";

const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/** An empty string in the front matter counts as "not filled in yet". */
const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

/** Front matter of src/content/blog/<en|id>/<name>.md. */
export const blogSchema = z.object({
  title: z.string().min(1),
  /** One or two sentences for the list, search results and link previews. */
  description: z.string().min(1),
  date: z.coerce.date(),
  /** Only an explicit `draft: false` publishes; forgetting the field keeps the article private. */
  draft: z.boolean().default(true),
  /** File name inside src/assets/blog/<name>/, where <name> is the article's file name. */
  cover: optionalText,
  /** Alt text in the language of the file; required whenever there is a cover. */
  coverAlt: optionalText,
  tags: z.array(z.string().min(1)).default([]),
  /** URL segment for this language; defaults to the file name. */
  slug: z.string().regex(kebabCase, "slug must be lowercase words joined by hyphens").optional(),
}).strict().superRefine((article, context) => {
  if (article.cover && !article.coverAlt) {
    context.addIssue({
      code: "custom",
      path: ["coverAlt"],
      message: "coverAlt is required when cover is set",
    });
  }
  if (article.coverAlt && !article.cover) {
    context.addIssue({
      code: "custom",
      path: ["cover"],
      message: "coverAlt is set but cover is empty",
    });
  }
});

export type BlogData = z.infer<typeof blogSchema>;
export { kebabCase as BLOG_NAME_PATTERN };
