import { stringifyLines } from "@raviqqe/hidash/json";
import { map } from "@raviqqe/hidash/promise";
import { toByteStream, toStream } from "@raviqqe/hidash/stream";
import { type ZodType } from "zod";
import { type PipeResult } from "valibot";
import { RpcError } from "./error.js";
import {
  type MiddlewareFunction,
  type MiddlewareOptions,
} from "./middleware.js";
import { type ProcedureOptions } from "./options.js";
import {
  type ErrorBody,
  inputParameterName,
  jsonHeaders,
  getJsonBody,
  mergeHeaders,
} from "./utility.js";

export { RpcError } from "./error.js";

type RawHandler<T, S> = (input: T, request: Request) => S | Promise<S>;

type RawStreamHandler<T, S> = (input: T, request: Request) => AsyncIterable<S>;

type RequestHandler = (request: Request) => Promise<Response>;

interface ProcedureRequestHandler<
  T,
  S,
  M extends boolean,
  R extends boolean,
  P extends string,
> {
  (request: Request): Promise<Response>;
  _input: T;
  _output: S;
  _mutate: M;
  _stream: R;
  _path: P;
}

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

export type MutateRequestHandler<
  T,
  S,
  P extends string = string,
> = ProcedureRequestHandler<T, S, true, false, P>;

type Validator<T> =
  | ZodType<T>
  | ((data: unknown) => PipeResult<T>)
  | ((data: unknown) => T);

const defaultStatus = 500;

export class Server {
  constructor(
    private readonly options: Partial<
      Pick<ProcedureOptions<string>, "headers" | "middlewares">
    > = {},
  ) {}

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
                handle(
                  validate(inputValidator, await getQueryInput(request)),
                  request,
                ),
                (output) => validate(outputValidator, output),
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
      new Response(
        JSON.stringify(
          validate(
            outputValidator,
            await handle(
              validate(inputValidator, await getInput(request)),
              request,
            ),
          ),
        ),
        { headers: mergeHeaders(options.headers, jsonHeaders) },
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
      return new Response(
        JSON.stringify({
          message: error instanceof Error ? error.message : "Unknown error",
        } satisfies ErrorBody),
        {
          headers: jsonHeaders,
          status:
            error instanceof RpcError
              ? error.status ?? defaultStatus
              : defaultStatus,
        },
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

const validate = <T>(validator: Validator<T>, data: unknown): T => {
  if (!(validator instanceof Function)) {
    return validator.parse(data);
  }

  const value = validator(data);

  if (value instanceof Object && "issues" in value) {
    throw new Error("Failed to parse", { cause: value.issues });
  }

  return value instanceof Object && "output" in value ? value.output : value;
};

const resolveOptions = <P extends string>(
  options: Partial<ProcedureOptions<P>>,
): ProcedureOptions<P> => ({
  headers: options.headers ?? {},
  middlewares: options.middlewares ?? [],
  path: options.path ?? ("" as P),
});
