type RequestHandler = (request: Request) => Promise<Response>;

type RawHandler<T, S> = (input: T) => S | Promise<S>;

export const query =
  <T, S>(handle: RawHandler<T, S>): RequestHandler =>
  (request) =>
    handleError(async () => {
      return new Response(
        JSON.stringify(
          await handle(JSON.parse(new URL(request.url).searchParams))
        ),
        { status: 200 }
      );
    });

export const mutate =
  <T, S>(handle: RawHandler<T, S>): RequestHandler =>
  (request) =>
    handleError(async () => {
      return new Response(
        JSON.stringify(await handle(JSON.parse(await request.json()))),
        { status: 200 }
      );
    });

const handleError = async (
  handle: () => Promise<Response>
): Promise<Response> => {
  try {
    return handle();
  } catch (error) {
    return new Response(undefined, { status: 500 });
  }
};
