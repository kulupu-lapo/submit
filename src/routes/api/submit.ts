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
  const content = `${yaml.dump(frontmatter)}\n---\n${dataPR.text}`;
  const env = getEnv(c);
  const [owner, repo] = env.GITHUB_REPO.split("/");
  const branch = `submission-${Date.now()}`;
  const filePath = [
    "plaintext",
    frontmatter.date.getUTCFullYear(),
    ("0" + (frontmatter.date.getUTCMonth() + 1)).slice(-2), // Date() is outstandingly stupid
    `${dataPR.filename}.yaml`,
  ].join("/");

  return c.json({ filePath, content });

  return c.json(
    await pullRequest({
      env: env,
      owner: owner,
      repo: repo,
      branch: branch,
      filePath: filePath,
      content: content,
      dryRun: true,
    }),
  );
});

export default app;
