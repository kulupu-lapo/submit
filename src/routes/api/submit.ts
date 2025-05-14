import { getEnv } from "@/utils/env";
import { pullRequest } from "@/utils/pullRequest";
import { Hono } from "hono";
import { z } from "zod";

const Article = z
  .object({
    title: z.string(),
    description: z.string().nullable(),
    authors: z.array(z.string()).nullable(),
    proofreaders: z.array(z.string()).nonempty().nullable(),
    // Date is required for all except `unknown-year/unknown-month`.
    // Those still have to specify null explicitly
    date: z.coerce.date(),
    "date-precision": z.union([
      z.literal("year"),
      z.literal("month"),
      z.literal("day"),
      z.literal("none"),
    ]),
    original: z
      .object({
        // NOTE: original-title may not exist, e.g. meli en mije li tawa
        title: z.string().nullable(),
        authors: z.array(z.string()).nonempty().nullable(),
      })
      .nullable(),
    tags: z.array(z.string()).nonempty().nullable(),
    // missing license -> "assume All rights reserved, but
    // its also possible we aren't yet aware of the correct license"
    license: z.string().nullable(), // TODO: SPDX compliance
    sources: z.array(z.string()).nonempty().nullable(),
    archives: z.array(z.string()).nonempty().nullable(),
    preprocessing: z.string().nullable(),
    "accessibility-notes": z.string().nullable(),
    notes: z.string().nullable(),
  })
  .strict(); // reject additional fields

const app = new Hono();

app.post("/", async (c) => {
  const contentType = c.req.header("content-type") || "";
  let body: any = {};

  if (contentType.includes("application/json")) {
    body = await c.req.json();
  } else if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    body = await c.req.parseBody();
  }

  const request = {
    "submitted-by": body["submitted-by"],
    text: body.text,
    metadata: Article.parse({
      title: body.title,
      description: body.description ?? null,
      authors: body.authors
        ? body.authors.split(",").map((item: string) => item.trim())
        : null,
      proofreaders: null,
      date: body.date,
      "date-precision": body["date-precision"],
      original: null,
      tags: body.tags
        ? body.tags.split(",").map((item: string) => item.trim())
        : null,
      license: body.license ?? null,
      sources: body.sources
        ? body.sources.split(",").map((item: string) => item.trim())
        : null,
      archives: null,
      preprocessing: null,
      "accessibility-notes": null,
      notes: body.notes ?? null,
    }),
  };

  return c.json(request);

  const yamlContent = `title: ${data.title}\ndescription: ${data.description}\n`;

  const env = getEnv(c);

  const [owner, repo] = env.GITHUB_REPO.split("/");
  const branch = `submission-${Date.now()}`;
  const filePath = `plaintext/${branch}.yaml`;
  // const yamlContent = `test`;

  return c.json(
    await pullRequest({
      env: env,
      owner: owner,
      repo: repo,
      branch: branch,
      filePath: filePath,
      content: yamlContent,
      dryRun: true,
    }),
  );
});

export default app;
