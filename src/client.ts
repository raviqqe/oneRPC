import { parseLines } from "@raviqqe/hidash/json.js";
import { toIterable, toStringStream } from "@raviqqe/hidash/stream.js";
import {
  type QueryRequestHandler,
  type QueryStreamRequestHandler,
  type MutateRequestHandler,
} from "./main.js";
import {
  type ErrorBody,
  inputParameterName,
  jsonHeaders,
  getJsonBody,
} from "./utility.js";

interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  baseUrl?: string;
}

export class Client {
  private readonly getOptions: () => RequestOptions;

  constructor(options: RequestOptions | (() => RequestOptions) = {}) {
    this.getOptions = typeof options === "function" ? options : () => options;
  }

  public query<T extends QueryRequestHandler<unknown, unknown>>(
    path: T["_path"],
    input: T["_input"],
    options: RequestOptions = {}
  ): Promise<T["_output"]> {
    return query(path, input, this.resolveOptions(options));
  }

  public async *queryStream<
    T extends QueryStreamRequestHandler<unknown, unknown>
  >(
    path: T["_path"],
    input: T["_input"],
    options: RequestOptions = {}
  ): AsyncIterable<T["_output"]> {
    yield* queryStream(path, input, this.resolveOptions(options));
  }

  public mutate<T extends MutateRequestHandler<unknown, unknown>>(
    path: T["_path"],
    input: T["_input"],
    options: RequestOptions = {}
  ): Promise<T["_output"]> {
    return mutate(path, input, this.resolveOptions(options));
  }

  private resolveOptions(requestOptions: RequestOptions): RequestOptions {
    const defaultOptions = this.getOptions();
    const headers = new Headers();

    for (const initial of [defaultOptions.headers, requestOptions.headers]) {
      for (const [key, value] of new Headers(initial).entries()) {
        headers.set(key, value);
      }
    }

    return { ...defaultOptions, ...requestOptions, headers };
  }
}

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

  if (response.status !== 200) {
    throw await buildError(response);
  } else if (!response.body) {
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
    new Request(resolveUrl(path, options.baseUrl), {
      ...options,
      body: JSON.stringify(input),
      headers: { ...options.headers, ...jsonHeaders },
      method: "post",
    })
  );

const buildQueryRequest = (
  path: string,
  input: unknown,
  options: RequestOptions
): Request => {
  const url = resolveUrl(path, options.baseUrl);
  const parameters = new URLSearchParams({
    [inputParameterName]: JSON.stringify(input) || "",
  }).toString();

  return new Request(`${url}?${parameters}`, options);
};

const procedure = async <T extends MutateRequestHandler<unknown, unknown>>(
  request: Request
): Promise<T["_output"]> => {
  const response = await fetch(request);

  if (response.status !== 200) {
    throw await buildError(response);
  }

  return (await getJsonBody(response)) as T["_output"];
};

const resolveUrl = (path: string, baseUrl?: string): string =>
  baseUrl ? new URL(path, baseUrl).toString() : path;

const buildError = async (response: Response): Promise<Error> =>
  new Error(((await response.json()) as ErrorBody).message);
