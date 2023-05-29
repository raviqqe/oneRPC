export interface ErrorBody {
  message: string;
}

export const inputParameterName = "input";

export const jsonHeaders = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "content-type": "application/json",
};

export const getJsonBody = async (
  response: Request | Response
): Promise<unknown> => {
  try {
    return (await response.json()) as unknown;
  } catch (_error) {
    // Even when clients pass `new Request("url", { body: undefined })`,
    // bodies are defined as `ReadableStream` after transferred to the other side...
    // TODO Does inspection of content length headers work in general?
    return undefined;
  }
};

export const mergeHeaders = (
  one?: HeadersInit,
  other?: HeadersInit
): Headers => {
  const headers = new Headers();

  for (const initial of [one, other]) {
    for (const [key, value] of new Headers(initial).entries()) {
      headers.set(key, value);
    }
  }

  return headers;
};
