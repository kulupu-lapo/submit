import { Octokit } from "@octokit/rest";
import { Hono } from "hono";

const app = new Hono();

app.post("/", async (c) => {
  const body = await c.req.parseBody();
  const data = {
    title: body.title,
    description: body.description,
  };
  const yamlContent = `title: ${data.title}\ndescription: ${data.description}\n`;

  const env: any = c.env;
  const repoFullName = env.GITHUB_REPO ?? process.env.GITHUB_REPO;
  const token = env.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN;

  const [owner, repo] = repoFullName.split("/");
  const branch = `submission-${Date.now()}`;
  const filePath = `submissions/${branch}.yaml`;
  // const yamlContent = `test`;

  const octokit = new Octokit({ auth: token });

  // Get the default branch reference
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: "heads/main",
  });

  const baseSha = refData.object.sha;

  // Show that we're logged into Github and that the file is generate-able.
  // Everything below this point impacts state so let's not keep testing it right now.
  return c.json({ sha: baseSha, yaml: yamlContent });

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
