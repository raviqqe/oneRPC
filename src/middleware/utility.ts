export type MiddlewareFunction = (
  request: Request,
  handle: (request: Request) => Promise<Response>,
  options: MiddlewareOptions,
) => Promise<Response>;

export interface MiddlewareOptions {
  mutate: boolean;
  stream: boolean;
}
