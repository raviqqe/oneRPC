import { isAsyncIterable, map } from "@raviqqe/hidash/promise.js";
import { toByteStream, toStream } from "@raviqqe/hidash/stream.js";
import { type ZodType } from "zod";
import { UserError } from "./error.js";

export { UserError } from "./error.js";

type RawHandler<T, S> = (input: T) => S | Promise<S>;

interface ProcedureRequestHandler<T, S, M extends boolean> {
  (request: Request): Promise<Response>;
  _input: T;
  _output: S;
  _mutate: M;
}

export type QueryRequestHandler<T, S> = ProcedureRequestHandler<T, S, false>;

export type MutateRequestHandler<T, S> = ProcedureRequestHandler<T, S, true>;

type Validator<T> = ZodType<T> | ((data: unknown) => T);

type ResponseBody = AsyncIterable<unknown> | object | null | undefined;

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
    handle
  );

export const mutate = <T, S extends ResponseBody>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>
): MutateRequestHandler<T, S> => {
  const handler: ProcedureRequestHandler<T, S, boolean> = procedure(
    (request) => request.json(),
    inputValidator,
    outputValidator,
    handle
  );

  handler._mutate = true as const;

  return handler as MutateRequestHandler<T, S>;
};

const procedure = <T, S extends ResponseBody>(
  getInput: (request: Request) => Promise<unknown> | unknown,
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>
): ProcedureRequestHandler<T, S, false> => {
  const handler = async (request: Request) => {
    try {
      const data = validate(
        outputValidator,
        await handle(validate(inputValidator, await getInput(request)))
      );

      if (data === undefined) {
        return new Response(undefined);
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
  handler._output = undefined as S;
  handler._mutate = false as const;

  return handler;
};

const validate = <T>(validator: Validator<T>, data: unknown): T =>
  validator instanceof Function ? validator(data) : validator.parse(data);
