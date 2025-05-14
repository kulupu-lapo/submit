import { Env } from "@/utils/env";
import { Octokit } from "@octokit/rest";

interface pullRequestI {
  env: Env;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  content: string;
  dryRun: boolean;
}

export const pullRequest = async (c: pullRequestI) => {
  const octokit = new Octokit({ auth: c.env.GITHUB_TOKEN });

  // Get the default branch reference
  const { data: refData } = await octokit.git.getRef({
    owner: c.owner,
    repo: c.repo,
    ref: "heads/main",
  });

  const baseSha = refData.object.sha;

  // Show that we're logged into Github and that the file is generate-able.
  // Everything below this point impacts state so let's not keep testing it right now.
  if (c.dryRun)
    return {
      sha: baseSha,
      branch: c.branch,
      filepath: c.filePath,
      content: c.content,
    };

  // Create a new branch
  await octokit.git.createRef({
    owner: c.owner,
    repo: c.repo,
    ref: `refs/heads/${c.branch}`,
    sha: baseSha,
  });

  // Create file in the new branch
  await octokit.repos.createOrUpdateFileContents({
    owner: c.owner,
    repo: c.repo,
    path: c.filePath,
    message: `Add YAML submission ${c.branch}`,
    content: Buffer.from(c.content).toString("base64"),
    branch: c.branch,
  });

  // Create a pull request
  const { data: pr } = await octokit.pulls.create({
    owner: c.owner,
    repo: c.repo,
    title: `Form submission ${c.branch}`,
    head: c.branch,
    base: "main",
    body: "Automatically generated from form submission.",
  });

  return pr;
};
