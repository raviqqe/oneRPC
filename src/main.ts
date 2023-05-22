import { stringifyLines } from "@raviqqe/hidash/json.js";
import { map } from "@raviqqe/hidash/promise.js";
import { toByteStream, toStream } from "@raviqqe/hidash/stream.js";
import { type ZodType } from "zod";
import { UserError } from "./error.js";

export { UserError } from "./error.js";

type RawHandler<T, S> = (input: T) => S | Promise<S>;

type RawStreamHandler<T, S> = (input: T) => AsyncIterable<S>;

interface ProcedureRequestHandler<T, S, M extends boolean, R extends boolean> {
  (request: Request): Promise<Response>;
  _input: T;
  _output: S;
  _mutate: M;
  _stream: R;
}

export type QueryRequestHandler<T, S> = ProcedureRequestHandler<
  T,
  S,
  false,
  false
>;

export type QueryStreamRequestHandler<T, S> = ProcedureRequestHandler<
  T,
  S,
  false,
  true
>;

export type MutateRequestHandler<T, S> = ProcedureRequestHandler<
  T,
  S,
  true,
  false
>;

type Validator<T> = ZodType<T> | ((data: unknown) => T);

type ResponseBody = AsyncIterable<unknown> | object | null;

const inputParameterName = "input";

export const query = <T, S extends ResponseBody>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>
): QueryRequestHandler<T, S> =>
  jsonProcedure(
    getSearchParameterInput,
    inputValidator,
    outputValidator,
    handle,
    false
  );

export const queryStream = <T, S>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawStreamHandler<T, S>
): QueryStreamRequestHandler<T, S> =>
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
                  )
                ),
                (output) => validate(outputValidator, output)
              )
            )
          )
        )
      ),
    false,
    true
  );

export const mutate = <T, S extends ResponseBody>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>
): MutateRequestHandler<T, S> =>
  jsonProcedure(
    (request) => request.json(),
    inputValidator,
    outputValidator,
    handle,
    true
  );

const jsonProcedure = <T, S extends ResponseBody, M extends boolean>(
  getInput: (request: Request) => Promise<unknown> | unknown,
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>,
  mutate: M
): ProcedureRequestHandler<T, S, M, false> =>
  procedure(
    async (request: Request) =>
      new Response(
        JSON.stringify(
          validate(
            outputValidator,
            await handle(validate(inputValidator, await getInput(request)))
          )
        ),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { headers: { "content-type": "application/json" } }
      ),
    mutate,
    false
  );

const procedure = <T, S, M extends boolean, R extends boolean>(
  handle: (request: Request) => Promise<Response>,
  mutate: M,
  stream: R
): ProcedureRequestHandler<T, S, M, R> => {
  const handler = async (request: Request) => {
    try {
      return await handle(request);
    } catch (error) {
      return new Response(undefined, {
        status: error instanceof UserError ? 400 : 500,
      });
    }
  };

  handler._input = undefined as T;
  handler._output = undefined as unknown as S;
  handler._mutate = mutate;
  handler._stream = stream;

  return handler;
};

const getSearchParameterInput = (request: Request): unknown => {
  const input = new URL(request.url).searchParams.get(inputParameterName);

  if (!input) {
    throw new Error("Input parameter not defined");
  }

  return JSON.parse(decodeURIComponent(input)) as unknown;
};

const validate = <T>(validator: Validator<T>, data: unknown): T =>
  validator instanceof Function ? validator(data) : validator.parse(data);
