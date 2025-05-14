import { Octokit } from "@octokit/rest";
import { Hono } from "hono";

import { renderer } from "./renderer";

import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { trimTrailingSlash } from "hono/trailing-slash";
import type { StatusCode } from "hono/utils/http-status";

import dotenv from "dotenv";

dotenv.config();

type EnvI = {
  GITHUB_REPO: string;
  GITHUB_TOKEN: string;
};

const app = new Hono()
  .use("*", secureHeaders())
  .use("*", prettyJSON())
  .use("*", trimTrailingSlash())
  .use("*", logger());

app.use(renderer);

app.get("/", (c) => {
  return c.render(<h1>Hello world</h1>);
});

app.onError((err: Error & { status?: StatusCode }, c) => {
  console.error(err);
  return c.json(
    {
      ok: false as const,
      message: err.message,
      stack: err.stack,
      status: err.status,
      cause: err.cause,
    },
    err.status ?? 500,
  );
});

app.get("/api/test-env", async (c) => {
  const env: any = c.env;
  const repoFullName = env.GITHUB_REPO ?? process.env.GITHUB_REPO; // e.g. "youruser/yourrepo"
  const token = env.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;

  return c.json({
    repo: repoFullName.replaceAll(/\w/g, "*"),
    token: token.slice(0, 4),
  });
});

app.get("/api/submit", async (c) => {
  const env: any = c.env;
  const repoFullName = env.GITHUB_REPO ?? process.env.GITHUB_REPO; // e.g. "youruser/yourrepo"
  const token = env.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;

  const [owner, repo] = repoFullName.split("/");
  const branch = `submission-${Date.now()}`;
  const filePath = `submissions/${branch}.yaml`;
  const yamlContent = `test`;

  const octokit = new Octokit({ auth: token });

  // Get the default branch reference
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: "heads/main",
  });

  const baseSha = refData.object.sha;

  // Create a new branch
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branch}`,
    sha: baseSha,
  });

  // Create file in the new branch
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message: `Add YAML submission ${branch}`,
    content: Buffer.from(yamlContent).toString("base64"),
    branch,
  });

  // Create a pull request
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: `Form submission ${branch}`,
    head: branch,
    base: "main",
    body: "Automatically generated from form submission.",
  });

  return c.json(pr);
});

export default app;
