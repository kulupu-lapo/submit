import { getEnv } from "@/utils/env";
import { Hono } from "hono";

const app = new Hono();

app.get("/", async (c) => {
  const env = getEnv(c);

  return c.json({
    repo: env.GITHUB_REPO.replaceAll(/\w/g, "*"),
    token: env.GITHUB_TOKEN.slice(0, 4),
  });
});

export default app;
