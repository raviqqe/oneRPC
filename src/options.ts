import { type MiddlewareFunction } from "./middleware.js";

export interface ProcedureOptions<T extends string> {
  path: T;
  headers: HeadersInit;
  middlewares: MiddlewareFunction[];
}
