import { Hono } from "hono";

const app = new Hono();

app.get("/", async (c) => {
  const env: any = c.env;
  const repoFullName = env.GITHUB_REPO ?? process.env.GITHUB_REPO;
  const token = env.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;

  return c.json({
    repo: repoFullName.replaceAll(/\w/g, "*"),
    token: token.slice(0, 4),
  });
});

export default app;
