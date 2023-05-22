import { parseLines } from "@raviqqe/hidash/json.js";
import {
  type QueryRequestHandler,
  type QueryStreamRequestHandler,
  type MutateRequestHandler,
} from "./main.js";
import { toIterable, toStringStream } from "@raviqqe/hidash/stream.js";

export const query = async <T extends QueryRequestHandler<unknown, unknown>>(
  path: string,
  input: T["_input"]
): Promise<T["_output"]> => {
  return procedure(buildQueryRequest(path, input));
};

export const queryStream = async function* <
  T extends QueryStreamRequestHandler<unknown, unknown>
>(path: string, input: T["_input"]): AsyncIterable<T["_output"]> {
  const response = await fetch(buildQueryRequest(path, input));

  if (!response.body) {
    throw new Error("Empty stream body");
  }

  yield* parseLines(toIterable(toStringStream(response.body))) as AsyncIterable<
    T["_output"]
  >;
};

export const mutate = async <T extends MutateRequestHandler<unknown, unknown>>(
  path: string,
  input: T["_input"]
): Promise<T["_output"]> =>
  procedure(
    new Request(path, {
      body: JSON.stringify(input),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { "content-type": "application/json" },
    })
  );

const buildQueryRequest = (path: string, input: unknown): Request => {
  const parameters = new URLSearchParams({
    input: encodeURIComponent(JSON.stringify(input)),
  }).toString();

  return new Request(`${path}?${parameters}`);
};

const procedure = async <T extends MutateRequestHandler<unknown, unknown>>(
  request: Request
): Promise<T["_output"]> => {
  const response = await fetch(request);

  return (await response.json()) as T["_output"];
};
