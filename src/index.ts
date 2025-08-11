import { stringifyLines } from "@raviqqe/hidash/json";
import { map, toByteStream, toStream } from "@raviqqe/loscore/async";
import { RpcError } from "./error.js";
import type { MiddlewareFunction, MiddlewareOptions } from "./middleware.js";
import type { ProcedureOptions } from "./options.js";
import {
  type ErrorBody,
  getJsonBody,
  inputParameterName,
  jsonHeaders,
  mergeHeaders,
} from "./utility.js";

export { RpcError } from "./error.js";

export type MutateRequestHandler<
  T,
  S,
  P extends string = string,
> = ProcedureRequestHandler<T, S, true, false, P>;

export type QueryRequestHandler<
  T,
  S,
  P extends string = string,
> = ProcedureRequestHandler<T, S, false, false, P>;

export type QueryStreamRequestHandler<
  T,
  S,
  P extends string = string,
> = ProcedureRequestHandler<T, S, false, true, P>;

export type RequestHandler = (request: Request) => Promise<Response>;

export type Validator<T> = (data: unknown) => T;

interface ProcedureRequestHandler<
  T,
  S,
  M extends boolean,
  R extends boolean,
  P extends string,
> {
  (request: Request): Promise<Response>;
  _input: T;
  _mutate: M;
  _output: S;
  _path: P;
  _stream: R;
}

type RawHandler<T, S> = (input: T, request: Request) => Promise<S> | S;

type RawStreamHandler<T, S> = (input: T, request: Request) => AsyncIterable<S>;

const defaultStatus = 500;

export class Server {
  private readonly options;

  public constructor(
    options: Partial<
      Pick<ProcedureOptions<string>, "headers" | "middlewares">
    > = {},
  ) {
    this.options = options;
  }

  public query<T, S, P extends string = string>(
    inputValidator: Validator<T>,
    outputValidator: Validator<S>,
    handle: RawHandler<T, S>,
    options: Partial<ProcedureOptions<P>> = {},
  ): QueryRequestHandler<T, S, P> {
    return query(
      inputValidator,
      outputValidator,
      handle,
      this.resolveOptions<P>(options),
    );
  }

  public queryStream<T, S, P extends string = string>(
    inputValidator: Validator<T>,
    outputValidator: Validator<S>,
    handle: RawStreamHandler<T, S>,
    options: Partial<ProcedureOptions<P>> = {},
  ): QueryStreamRequestHandler<T, S, P> {
    return queryStream(
      inputValidator,
      outputValidator,
      handle,
      this.resolveOptions<P>(options),
    );
  }

  public mutate<T, S, P extends string = string>(
    inputValidator: Validator<T>,
    outputValidator: Validator<S>,
    handle: RawHandler<T, S>,
    options: Partial<ProcedureOptions<P>> = {},
  ): MutateRequestHandler<T, S, P> {
    return mutate(
      inputValidator,
      outputValidator,
      handle,
      this.resolveOptions<P>(options),
    );
  }

  private resolveOptions<P extends string>(
    options: Partial<ProcedureOptions<P>>,
  ): Partial<ProcedureOptions<P>> {
    return {
      ...options,
      headers: mergeHeaders(this.options.headers, options.headers),
      middlewares: [
        ...(this.options.middlewares ?? []),
        ...(options.middlewares ?? []),
      ],
    };
  }
}

export const query = <T, S, P extends string = string>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>,
  options: Partial<ProcedureOptions<P>> = {},
): QueryRequestHandler<T, S, P> =>
  jsonProcedure(
    getQueryInput,
    inputValidator,
    outputValidator,
    handle,
    false,
    resolveOptions(options),
  );

export const queryStream = <T, S, P extends string = string>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawStreamHandler<T, S>,
  options: Partial<ProcedureOptions<P>> = {},
): QueryStreamRequestHandler<T, S, P> =>
  procedure(
    async (request: Request) =>
      new Response(
        toByteStream(
          toStream(
            stringifyLines(
              map(
                handle(inputValidator(await getQueryInput(request)), request),
                (output) => outputValidator(output),
              ),
            ),
          ),
        ),
        { headers: options.headers },
      ),
    false,
    true,
    resolveOptions(options),
  );

export const mutate = <T, S, P extends string = string>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>,
  options: Partial<ProcedureOptions<P>> = {},
): MutateRequestHandler<T, S, P> =>
  jsonProcedure(
    getJsonBody,
    inputValidator,
    outputValidator,
    handle,
    true,
    resolveOptions(options),
  );

const jsonProcedure = <T, S, P extends string, M extends boolean>(
  getInput: (request: Request) => unknown,
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>,
  mutate: M,
  options: ProcedureOptions<P>,
): ProcedureRequestHandler<T, S, M, false, P> =>
  procedure(
    async (request: Request) =>
      buildJsonResponse(
        outputValidator(
          await handle(inputValidator(await getInput(request)), request),
        ),
        options.headers,
      ),
    mutate,
    false,
    options,
  );

const procedure = <
  T,
  S,
  M extends boolean,
  R extends boolean,
  P extends string,
>(
  handle: RequestHandler,
  mutate: M,
  stream: R,
  options: ProcedureOptions<P>,
): ProcedureRequestHandler<T, S, M, R, P> => {
  const handler = async (request: Request) => {
    try {
      return await applyMiddlewares(options.middlewares, handle, {
        mutate,
        stream,
      })(request);
    } catch (error) {
      return buildJsonResponse(
        {
          message: error instanceof Error ? error.message : "Unknown error",
        } satisfies ErrorBody,
        {},
        error instanceof RpcError
          ? (error.status ?? defaultStatus)
          : defaultStatus,
      );
    }
  };

  handler._input = undefined as T;
  handler._output = undefined as unknown as S;
  handler._mutate = mutate;
  handler._stream = stream;
  handler._path = options.path;

  return handler;
};

const buildJsonResponse = (
  json: unknown,
  headers: HeadersInit,
  status?: number,
): Response => {
  const body = JSON.stringify(json);
  const length = new TextEncoder().encode(body).length;

  return new Response(body, {
    headers: mergeHeaders(headers, {
      ...jsonHeaders,

      "content-length": length.toString(),
    }),
    status,
  });
};

const applyMiddlewares = (
  [middleware, ...middlewares]: MiddlewareFunction[],
  handle: RequestHandler,
  options: MiddlewareOptions,
): RequestHandler =>
  middleware
    ? applyMiddlewares(
        middlewares,
        (request) => middleware(request, handle, options),
        options,
      )
    : handle;

const getQueryInput = (request: Request): unknown => {
  const input = new URL(request.url).searchParams.get(inputParameterName);

  return input ? JSON.parse(input) : undefined;
};

const resolveOptions = <P extends string>(
  options: Partial<ProcedureOptions<P>>,
): ProcedureOptions<P> => ({
  headers: options.headers ?? {},
  middlewares: options.middlewares ?? [],
  path: options.path ?? ("" as P),
});
