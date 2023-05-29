import { toArray } from "@raviqqe/hidash/promise";
import { toIterable, toStringStream } from "@raviqqe/hidash/stream";
import { type MiddlewareFunction } from "./utility.js";

export const etag: MiddlewareFunction = async (request, handle, { stream }) => {
  const response = await handle(request);

  if (stream || !response.body) {
    return response;
  }

  const etag = encodeTag(
    await crypto.subtle.digest("sha-1", await collectStream(response.body))
  );

  if (etag === request.headers.get("if-none-match")) {
    return new Response(null, {
      headers: { etag },
      status: 304,
    });
  }

  response.headers.set("etag", etag);
  return response;
};

const collectStream = async (
  stream: ReadableStream<Uint8Array>
): Promise<ArrayBuffer> =>
  new TextEncoder().encode(
    (await toArray(toIterable(toStringStream(stream)))).join("")
  );

const encodeTag = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));
