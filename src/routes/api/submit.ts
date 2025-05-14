import { getEnv } from "@/utils/env";
import { pullRequest } from "@/utils/pullRequest";
import { requestBody } from "@/utils/request";
import { Article } from "@/utils/schema";
import { Hono } from "hono";
import yaml from "js-yaml";

const app = new Hono();

app.post("/", async (c) => {
  let body = await requestBody(c);

  const request = {
    filename: body.filename,
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

  const content = `${yaml.dump(request.metadata)}\n---\n${request.text}`;

  const env = getEnv(c);

  const [owner, repo] = env.GITHUB_REPO.split("/");
  const branch = `submission-${Date.now()}`;
  const filePath = `plaintext/${request.metadata.date.getUTCFullYear()}/${request.metadata.date.getUTCMonth()}/${request.filename}.yaml`;

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
