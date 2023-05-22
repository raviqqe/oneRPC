import { stringifyLines } from "@raviqqe/hidash/json.js";
import { map } from "@raviqqe/hidash/promise.js";
import { toByteStream, toStream } from "@raviqqe/hidash/stream.js";
import { type ZodType } from "zod";
import { UserError } from "./error.js";
import { type ProcedureOptions } from "./options.js";

export { UserError } from "./error.js";

type RawHandler<T, S> = (input: T, request: Request) => S | Promise<S>;

type RawStreamHandler<T, S> = (input: T, request: Request) => AsyncIterable<S>;

interface ProcedureRequestHandler<
  T,
  S,
  M extends boolean,
  R extends boolean,
  P extends string
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
  P extends string = string
> = ProcedureRequestHandler<T, S, false, false, P>;

export type QueryStreamRequestHandler<
  T,
  S,
  P extends string = string
> = ProcedureRequestHandler<T, S, false, true, P>;

export type MutateRequestHandler<
  T,
  S,
  P extends string = string
> = ProcedureRequestHandler<T, S, true, false, P>;

type Validator<T> = ZodType<T> | ((data: unknown) => T);

const inputParameterName = "input";

export const query = <T, S, P extends string = string>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>,
  options: Partial<ProcedureOptions<P>> = {}
): QueryRequestHandler<T, S, P> =>
  jsonProcedure(
    getSearchParameterInput,
    inputValidator,
    outputValidator,
    handle,
    false,
    resolveOptions(options)
  );

export const queryStream = <T, S, P extends string = string>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawStreamHandler<T, S>,
  options: Partial<ProcedureOptions<P>> = {}
): QueryStreamRequestHandler<T, S, P> =>
  procedure(
    async (request: Request) =>
      new Response(
        toByteStream(
          toStream(
            stringifyLines(
              map(
                handle(
                  validate(
                    inputValidator,
                    await getSearchParameterInput(request)
                  ),
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

export const mutate = <T, S, P extends string = string>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>,
  options: Partial<ProcedureOptions<P>> = {}
): MutateRequestHandler<T, S, P> =>
  jsonProcedure(
    (request) => request.json(),
    inputValidator,
    outputValidator,
    handle,
    true,
    resolveOptions(options)
  );

const jsonProcedure = <T, S, P extends string, M extends boolean>(
  getInput: (request: Request) => Promise<unknown> | unknown,
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>,
  mutate: M,
  options: ProcedureOptions<P>
): ProcedureRequestHandler<T, S, M, false, P> =>
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
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "content-type": "application/json",
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
  P extends string
>(
  handle: (request: Request) => Promise<Response>,
  mutate: M,
  stream: R,
  options: ProcedureOptions<P>
): ProcedureRequestHandler<T, S, M, R, P> => {
  const handler = async (request: Request) => {
    try {
      return await handle(request);
    } catch (error) {
      return new Response(undefined, {
        status: error instanceof UserError ? error.status ?? 400 : 500,
      });
    }
  };

  handler._input = undefined as T;
  handler._output = undefined as unknown as S;
  handler._mutate = mutate;
  handler._stream = stream;
  handler._path = options.path;

  return handler;
};

const getSearchParameterInput = (request: Request): unknown => {
  const input = new URL(request.url).searchParams.get(inputParameterName);

  if (!input) {
    throw new Error("Input parameter not defined");
  }

  return JSON.parse(input);
};

const validate = <T>(validator: Validator<T>, data: unknown): T =>
  validator instanceof Function ? validator(data) : validator.parse(data);

const resolveOptions = <P extends string>(
  options: Partial<ProcedureOptions<P>>
): ProcedureOptions<P> => ({
  headers: options.headers ?? {},
  path: options.path ?? ("" as P),
});
