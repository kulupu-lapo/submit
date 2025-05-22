import { getEnv } from "@/utils/env";
import { pullRequest } from "@/utils/pullRequest";
import { requestBody } from "@/utils/request";
import { Article, DataPR } from "@/utils/schema";
import { Hono } from "hono";
import yaml from "js-yaml";

const app = new Hono();

const arrayOf = (string: string) =>
  string
    ? string
        .split(",")
        .map((item: string) => item.trim())
        .filter((x) => x)
    : null;
const nullishObj = (object: any) =>
  Object.values(object).reduce((prev, next) => {
    next != null;
  });

app.post("/", async (c) => {
  let body = await requestBody(c);

  let original = {
    title: body["original-title"] || null,
    authors: arrayOf(body["original-authors"]),
  };
  let frontmatterResult = Article.safeParse({
    title: body.title,
    description: body.description || null,
    authors: arrayOf(body.authors),
    proofreaders: null,
    date: body.date,
    "date-precision": body["date-precision"],
    original:
      original.title != null || original.authors != null ? original : null,
    tags: arrayOf(body.tags),
    license: body.license || null,
    sources: arrayOf(body.sources),
    archives: null,
    preprocessing: null,
    "accessibility-notes": null,
    notes: body.notes || null,
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

  const filepath = [
    "plaintext",
    frontmatter.date.getUTCFullYear(),
    ("0" + (frontmatter.date.getUTCMonth() + 1)).slice(-2), // Date() is outstandingly stupid
    `${dataPR.filename}.md`,
  ].join("/");

  // Unfortunately, dates get displayed as datetimes by default.
  // we want just the date
  frontmatter.date = frontmatter.date.toISOString().split("T")[0];

  const env = getEnv(c);
  return c.json({
    success: true,
    data: await pullRequest({
      env: env,
      owner: env.GITHUB_REPO.split("/")[0],
      repo: env.GITHUB_REPO.split("/")[1],
      branch: `pana/${dataPR.filename}-${Date.now()}`,
      title: `[submission] from ${dataPR["submitted-by"]}: ${frontmatter.title}`,
      filePath: filepath,
      content: `---\n${yaml.dump(frontmatter)}---\n\n${dataPR.text}\n`,
      dryRun: false,
    }),
  });
});

export default app;
