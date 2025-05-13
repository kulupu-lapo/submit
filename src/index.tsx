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

// app.get("/api/submit", async (c) => {
//   const body = await c.req.parseBody();
//   const title = body.title as string;
//   const description = body.description as string;

//   const yamlContent = `---\ntitle: "${title}"\ndescription: "${description}"\n`;

//   const result = await createPullRequest(yamlContent, c.env);
//   return c.json({ success: true, result: result });
// });

// async function createPullRequest(yamlContent: string, env: any) {
//   const repo = env.GITHUB_REPO; // e.g. "youruser/yourrepo". Testing the ability to use Cloudflare secrets.
//   // const token = env.GITHUB_TOKEN;

//   return { repo };
// }

export default app;
