import { toByteStream, toStream } from "@raviqqe/hidash/stream.js";
import { isAsyncIterable, map } from "@raviqqe/hidash/promise.js";
import { type ZodType } from "zod";

type RawHandler<T, S> = (input: T) => S | Promise<S>;

type RequestHandler = (request: Request) => Promise<Response>;

type Validator<T> = ZodType<T> | ((data: unknown) => T);

type ResponseBody = AsyncIterable<unknown> | object | null | undefined;

const inputParameterName = "input";

export const query = <T, S extends ResponseBody>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>
): RequestHandler =>
  procedure(
    (request) => {
      const input = new URL(request.url).searchParams.get(inputParameterName);

      if (!input) {
        throw new Error("Input parameter not defined");
      }

      return JSON.parse(input);
    },
    inputValidator,
    outputValidator,
    handle
  );

export const mutate = <T, S extends ResponseBody>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>
): RequestHandler =>
  procedure(
    (request) => request.json(),
    inputValidator,
    outputValidator,
    handle
  );

const procedure =
  <T, S extends ResponseBody>(
    getInput: (request: Request) => Promise<unknown>,
    inputValidator: Validator<T>,
    outputValidator: Validator<S>,
    handle: RawHandler<T, S>
  ): RequestHandler =>
  async (request) => {
    try {
      const data = validate(
        outputValidator,
        await handle(validate(inputValidator, await getInput(request)))
      );

      return new Response(
        data === undefined
          ? undefined
          : isAsyncIterable(data)
          ? toByteStream(toStream(map(data, JSON.stringify)))
          : JSON.stringify(data)
      );
    } catch (error) {
      return new Response(undefined, { status: 500 });
    }
  };

const validate = <T>(validator: Validator<T>, data: unknown): T =>
  validator instanceof Function ? validator(data) : validator.parse(data);
