import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { trimTrailingSlash } from "hono/trailing-slash";
import type { StatusCode } from "hono/utils/http-status";

import submit from "@/routes/api/submit";
import testEnv from "@/routes/api/test-env";
import { renderer } from "@/utils/renderer";

const app = new Hono()
  .use(
    "*",
    cors({
      origin: (origin) => {
        // Allow all localhost origins
        return origin?.startsWith("http://localhost") ||
          [
            "https://lipu.pona.la",
            "https://lapo.pona.la",
            "https://kulupu-lapo.github.io",
          ].includes(origin)
          ? origin
          : "https://submit-4gx.pages.dev";
      },
      allowHeaders: ["Content-Type"],
      allowMethods: ["POST", "GET", "OPTIONS"],
    }),
  )
  .use("*", secureHeaders())
  .use("*", prettyJSON())
  .use("*", trimTrailingSlash())
  .use("*", logger());

app.use(renderer);

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

app.get("/", (c) => {
  return c.render(
    <form method="post" action="/api/submit">
      <input name="title" placeholder="Title" required />
      <input name="description" placeholder="Description" required />
      <button type="submit">Submit</button>
    </form>,
  );
});
app.route("/api/test-env", testEnv);
app.route("/api/submit", submit);

export default app;
