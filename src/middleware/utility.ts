export type MiddlewareOptions = { mutate: boolean; stream: boolean };

export type MiddlewareFunction = (
  request: Request,
  handle: (request: Request) => Promise<Response>,
  options: MiddlewareOptions
) => Promise<Response>;
