export type MiddlewareFunction = (
  request: Request,
  handle: (request: Request) => Promise<Response>,
  options: { mutate: boolean; stream: boolean }
) => Promise<Response>;
