import { parseLines } from "@raviqqe/hidash/json.js";
import { toIterable, toStringStream } from "@raviqqe/hidash/stream.js";
import {
  type QueryRequestHandler,
  type QueryStreamRequestHandler,
  type MutateRequestHandler,
} from "./main.js";

interface RequestOptions extends Omit<RequestInit, "body" | "method"> {}

export const query = async <T extends QueryRequestHandler<unknown, unknown>>(
  path: T["_path"],
  input: T["_input"],
  options: RequestOptions = {}
): Promise<T["_output"]> => procedure(buildQueryRequest(path, input, options));

export const queryStream = async function* <
  T extends QueryStreamRequestHandler<unknown, unknown>
>(
  path: T["_path"],
  input: T["_input"],
  options: RequestOptions = {}
): AsyncIterable<T["_output"]> {
  const response = await fetch(buildQueryRequest(path, input, options));

  if (!response.body) {
    throw new Error("Empty stream body");
  }

  yield* parseLines(toIterable(toStringStream(response.body))) as AsyncIterable<
    T["_output"]
  >;
};

export const mutate = async <T extends MutateRequestHandler<unknown, unknown>>(
  path: T["_path"],
  input: T["_input"],
  options: RequestOptions = {}
): Promise<T["_output"]> =>
  procedure(
    new Request(path, {
      ...options,
      body: JSON.stringify(input),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { ...options.headers, "content-type": "application/json" },
      method: "post",
    })
  );

const buildQueryRequest = (
  path: string,
  input: unknown,
  options: RequestOptions
): Request => {
  const parameters = new URLSearchParams({
    input: JSON.stringify(input),
  }).toString();

  return new Request(`${path}?${parameters}`, options);
};

const procedure = async <T extends MutateRequestHandler<unknown, unknown>>(
  request: Request
): Promise<T["_output"]> => {
  const response = await fetch(request);

  return (await response.json()) as T["_output"];
};
