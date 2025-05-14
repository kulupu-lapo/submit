export const requestBody = async (c: any) => {
  const contentType = c.req.header("content-type") || "";
  let body: any = {};

  if (contentType.includes("application/json")) {
    body = await c.req.json();
  } else if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    body = await c.req.parseBody();
  }
  return body;
};
