import { getEnv } from "@/utils/env";
import { pullRequest } from "@/utils/pullRequest";
import { requestBody } from "@/utils/request";
import { Article, DataPR } from "@/utils/schema";
import { Hono } from "hono";
import yaml from "js-yaml";

const app = new Hono();

app.post("/", async (c) => {
  let body = await requestBody(c);

  let frontmatterResult = Article.safeParse({
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
  });

  if (!frontmatterResult.success)
    return c.json({ success: false, error: frontmatterResult.error });
  const frontmatter = frontmatterResult.data;

  const dataPRResult = DataPR.safeParse({
    filename: body.filename,
    "submitted-by": body["submitted-by"],
    text: body.text,
  });

  if (!dataPRResult.success)
    return c.json({ success: false, error: dataPRResult.error });
  const dataPR = dataPRResult.data;

  // Unfortunately, dates get displayed as datetimes by default.
  // we want just the date
  const formattedFrontmatter: any = frontmatter;
  formattedFrontmatter.date = frontmatter.date.toISOString().split("T")[0];

  const env = getEnv(c);
  return c.json(
    await pullRequest({
      env: env,
      owner: env.GITHUB_REPO.split("/")[0],
      repo: env.GITHUB_REPO.split("/")[1],
      branch: `submission-${Date.now()}`,
      title: `[submission] from ${dataPR["submitted-by"]}: ${frontmatter.title}`,
      filePath: [
        "plaintext",
        frontmatter.date.getUTCFullYear(),
        ("0" + (frontmatter.date.getUTCMonth() + 1)).slice(-2), // Date() is outstandingly stupid
        `${dataPR.filename}.yaml`,
      ].join("/"),
      content: `${yaml.dump(formattedFrontmatter)}---\n\n${dataPR.text}`,
      dryRun: false,
    }),
  );
});

export default app;
