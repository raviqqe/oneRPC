import { toArray, toIterable, toStringStream } from "@raviqqe/loscore/async";
import { type MiddlewareFunction } from "./utility.js";

export const etag =
  ({ weak }: { weak?: boolean } = {}): MiddlewareFunction =>
  async (request, handle, { stream }) => {
    const response = await handle(request);

    if (stream || !response.body) {
      return response;
    }

    const newResponse = response.clone();
    const hash = encodeTag(
      await crypto.subtle.digest("sha-1", await collectStream(response.body)),
    );
    const etag = (weak ? "W/" : "") + `"${hash}"`;

    if (etag === request.headers.get("if-none-match")) {
      return new Response(null, {
        headers: { etag },
        status: 304,
      });
    }

    newResponse.headers.set("etag", etag);
    return newResponse;
  };

const collectStream = async (
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> =>
  new TextEncoder().encode(
    (await toArray(toIterable(toStringStream(stream)))).join(""),
  );

const encodeTag = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));
