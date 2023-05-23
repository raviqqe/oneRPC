import { stringifyLines } from "@raviqqe/hidash/json.js";
import { map } from "@raviqqe/hidash/promise.js";
import { toByteStream, toStream } from "@raviqqe/hidash/stream.js";
import { type ZodType } from "zod";
import { RpcError } from "./error.js";
import { type ProcedureOptions } from "./options.js";
import {
  type ErrorBody,
  inputParameterName,
  jsonHeaders,
  getJsonBody,
} from "./utility.js";

export { RpcError } from "./error.js";

type RawHandler<T, S> = (input: T, request: Request) => S | Promise<S>;

type RawStreamHandler<T, S> = (input: T, request: Request) => AsyncIterable<S>;

interface ProcedureRequestHandler<
  T,
  S,
  M extends boolean,
  R extends boolean,
  U extends string
> {
  (request: Request): Promise<Response>;
  _input: T;
  _output: S;
  _mutate: M;
  _stream: R;
  _url: U;
}

export type QueryRequestHandler<
  T,
  S,
  U extends string = string
> = ProcedureRequestHandler<T, S, false, false, U>;

export type QueryStreamRequestHandler<
  T,
  S,
  U extends string = string
> = ProcedureRequestHandler<T, S, false, true, U>;

export type MutateRequestHandler<
  T,
  S,
  U extends string = string
> = ProcedureRequestHandler<T, S, true, false, U>;

type Validator<T> = ZodType<T> | ((data: unknown) => T);

const defaultStatus = 500;

export const query = <T, S, U extends string = string>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>,
  options: Partial<ProcedureOptions<U>> = {}
): QueryRequestHandler<T, S, U> =>
  jsonProcedure(
    getQueryInput,
    inputValidator,
    outputValidator,
    handle,
    false,
    resolveOptions(options)
  );

export const queryStream = <T, S, U extends string = string>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawStreamHandler<T, S>,
  options: Partial<ProcedureOptions<U>> = {}
): QueryStreamRequestHandler<T, S, U> =>
  procedure(
    async (request: Request) =>
      new Response(
        toByteStream(
          toStream(
            stringifyLines(
              map(
                handle(
                  validate(inputValidator, await getQueryInput(request)),
                  request
                ),
                (output) => validate(outputValidator, output)
              )
            )
          )
        ),
        { headers: options.headers }
      ),
    false,
    true,
    resolveOptions(options)
  );

export const mutate = <T, S, U extends string = string>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>,
  options: Partial<ProcedureOptions<U>> = {}
): MutateRequestHandler<T, S, U> =>
  jsonProcedure(
    getJsonBody,
    inputValidator,
    outputValidator,
    handle,
    true,
    resolveOptions(options)
  );

const jsonProcedure = <T, S, U extends string, M extends boolean>(
  getInput: (request: Request) => Promise<unknown> | unknown,
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>,
  mutate: M,
  options: ProcedureOptions<U>
): ProcedureRequestHandler<T, S, M, false, U> =>
  procedure(
    async (request: Request) =>
      new Response(
        JSON.stringify(
          validate(
            outputValidator,
            await handle(
              validate(inputValidator, await getInput(request)),
              request
            )
          )
        ),
        {
          headers: {
            ...options.headers,
            ...jsonHeaders,
          },
        }
      ),
    mutate,
    false,
    options
  );

const procedure = <
  T,
  S,
  M extends boolean,
  R extends boolean,
  U extends string
>(
  handle: (request: Request) => Promise<Response>,
  mutate: M,
  stream: R,
  options: ProcedureOptions<U>
): ProcedureRequestHandler<T, S, M, R, U> => {
  const handler = async (request: Request) => {
    try {
      return await handle(request);
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
        }
      );
    }
  };

  handler._input = undefined as T;
  handler._output = undefined as unknown as S;
  handler._mutate = mutate;
  handler._stream = stream;
  handler._url = options.url;

  return handler;
};

const getQueryInput = (request: Request): unknown => {
  const input = new URL(request.url).searchParams.get(inputParameterName);

  return input ? JSON.parse(input) : undefined;
};

const validate = <T>(validator: Validator<T>, data: unknown): T =>
  validator instanceof Function ? validator(data) : validator.parse(data);

const resolveOptions = <U extends string>(
  options: Partial<ProcedureOptions<U>>
): ProcedureOptions<U> => ({
  headers: options.headers ?? {},
  url: options.url ?? ("" as U),
});
