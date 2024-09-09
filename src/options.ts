import { type MiddlewareFunction } from "./middleware.js";

export interface ProcedureOptions<T extends string> {
  headers: HeadersInit;
  middlewares: MiddlewareFunction[];
  path: T;
}
