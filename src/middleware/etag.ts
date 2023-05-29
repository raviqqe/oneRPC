import { type MiddlewareFunction } from "./utility.js";
import { toIterable, toStringStream } from "@raviqqe/hidash/stream";
import { toArray } from "@raviqqe/hidash/promise";

export const etag: MiddlewareFunction = async (request, handle, { stream }) => {
  const response = await handle(request);

  if (stream || !response.body) {
    return response;
  }

  const tag = request.headers.get("if-none-match");
  const newTag = decodeTag(
    await crypto.subtle.digest("sha1", await collectStream(response.body))
  );

  if (tag === newTag) {
    return new Response(null, {
      headers: response.headers,
      status: 304,
    });
  }

  response.headers.set("etag", newTag);
  return response;
};

const collectStream = async (
  stream: ReadableStream<Uint8Array>
): Promise<ArrayBuffer> => {
  return new TextEncoder().encode(
    (await toArray(toIterable(toStringStream(stream)))).join("")
  );
};

const decodeTag = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));
