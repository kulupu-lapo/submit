import { Hono } from "hono";
import { renderer } from "./renderer";

type EnvI = {
  GITHUB_REPO: string;
  GITHUB_TOKEN: string;
};

const app = new Hono();

app.use(renderer);

app.get("/", (c) => {
  return c.render(<h1>Hello world</h1>);
});

app.get("/api/submit", async (c) => {
  const body = await c.req.parseBody();
  return {success: true, repo: c.env.GITHUB_REPO)}

export default app;
