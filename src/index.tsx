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
  const token = c.env.GITHUB_TOKEN;

  const branch = `testing-${Date.now()}`;
  const filePath = `plaintext/${branch}.yaml`;

  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  // Get default branch SHA
  const baseRes = await fetch(
    `https://api.github.com/repos/${repo}/git/ref/heads/main`,
    { headers },
  );
  const baseData = await baseRes.json();
  const baseSha = baseData.object.sha;

  // Create new branch
  await fetch(`https://api.github.com/repos/${repo}/git/refs`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ref: `refs/heads/${branch}`,
      sha: baseSha,
    }),
  });

  // Create file in new branch
  await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `Add YAML submission ${branch}`,
      content: "test", // btoa(unescape(encodeURIComponent(yamlContent))),
      branch,
    }),
  });

  // Create Pull Request
  const prRes = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: `Form submission ${branch}`,
      head: branch,
      base: "main",
      body: "Automatically generated from form submission.",
    }),
  });

  return c.json(prRes.json());
});

export default app;
