import { type MiddlewareFunction } from "./utility.js";

export const etag: MiddlewareFunction = async (request, handle, { stream }) => {
  if (stream) {
    return handle(request);
  }

  const tag = request.headers.get("if-none-match");
  const response = await handle(request);
  const newTag = await crypto.subtle.digest("sha1", response.body);

  if (tag === newTag) {
    return response;
  }

  response.headers.set("etag", newTag);
  return response;
};
