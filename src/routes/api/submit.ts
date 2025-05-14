import { getEnv } from "@/utils/env";
import { pullRequest } from "@/utils/pullRequest";
import { Hono } from "hono";

const app = new Hono();

app.post("/", async (c) => {
  const body = await c.req.json();
  const data = {
    title: body.title,
    description: body.description,
  };
  const yamlContent = `title: ${data.title}\ndescription: ${data.description}\n`;

  const env = getEnv(c);

  const [owner, repo] = env.GITHUB_REPO.split("/");
  const branch = `submission-${Date.now()}`;
  const filePath = `submissions/${branch}.yaml`;
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
