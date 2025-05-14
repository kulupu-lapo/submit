import dotenv from "dotenv";
dotenv.config();

export type Env = {
  GITHUB_REPO: string;
  GITHUB_TOKEN: string;
};

export const getEnv = (c: any) =>
  ({
    GITHUB_REPO: c.env.GITHUB_REPO ?? process.env.GITHUB_REPO,
    GITHUB_TOKEN: c.env.GITHUB_TOKEN ?? process.env.GITHUB_TOKEN,
  }) as Env;
