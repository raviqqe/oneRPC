import { isAsyncIterable, map } from "@raviqqe/hidash/promise.js";
import { toByteStream, toStream } from "@raviqqe/hidash/stream.js";
import { type ZodType } from "zod";
import { UserError } from "./error.js";

export { UserError } from "./error.js";

type RawHandler<T, S> = (input: T) => S | Promise<S>;

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
  procedure(
    (request) => {
      const input = new URL(request.url).searchParams.get(inputParameterName);

      if (!input) {
        throw new Error("Input parameter not defined");
      }

      return JSON.parse(input) as unknown;
    },
    inputValidator,
    outputValidator,
    handle,
    false,
    false
  );

export const mutate = <T, S extends ResponseBody>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>
): MutateRequestHandler<T, S> => {
  return procedure(
    (request) => request.json(),
    inputValidator,
    outputValidator,
    handle,
    true,
    false
  );
};

const procedure = <
  T,
  S extends ResponseBody,
  M extends boolean,
  R extends boolean
>(
  getInput: (request: Request) => Promise<unknown> | unknown,
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>,
  mutate: M,
  stream: R
): ProcedureRequestHandler<T, S, M, R> => {
  const handler = async (request: Request) => {
    try {
      const data = validate(
        outputValidator,
        await handle(validate(inputValidator, await getInput(request)))
      );

      if (isAsyncIterable(data) !== stream) {
        throw new Error("Incompatible response type");
      } else if (isAsyncIterable(data)) {
        return new Response(toByteStream(toStream(map(data, JSON.stringify))));
      }

      return new Response(JSON.stringify(data), {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { "content-type": "application/json" },
      });
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

const validate = <T>(validator: Validator<T>, data: unknown): T =>
  validator instanceof Function ? validator(data) : validator.parse(data);
