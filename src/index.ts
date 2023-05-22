import { type ZodType } from "zod";

type RawHandler<T, S> = (input: T) => S | Promise<S>;

type RequestHandler = (request: Request) => Promise<Response>;

type Validator<T> = ZodType<T> | ((data: unknown) => T);

type ResponseBody = BodyInit | object | null | undefined;

const inputParameterName = "input";

export const query = <T, S extends ResponseBody>(
  inputValidator: Validator<T>,
  outputValidator: Validator<S>,
  handle: RawHandler<T, S>
): RequestHandler =>
  invoke(
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
  invoke((request) => request.json(), inputValidator, outputValidator, handle);

const invoke =
  <T, S extends ResponseBody>(
    getInput: (request: Request) => Promise<unknown>,
    inputValidator: Validator<T>,
    outputValidator: Validator<S>,
    handle: RawHandler<T, S>
  ): RequestHandler =>
  (request) =>
    handleError(async () =>
      buildResponse(
        validate(
          outputValidator,
          await handle(validate(inputValidator, await getInput(request)))
        )
      )
    );

const buildResponse = (data: BodyInit | object | null | undefined): Response =>
  data instanceof ReadableStream || data === undefined
    ? new Response(data)
    : new Response(JSON.stringify(data));

const handleError = async (
  handle: () => Promise<Response>
): Promise<Response> => {
  try {
    return handle();
  } catch (error) {
    return new Response(undefined, { status: 500 });
  }
};

const validate = <T>(validator: Validator<T>, data: unknown): T =>
  validator instanceof Function ? validator(data) : validator.parse(data);
