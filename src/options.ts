export interface ProcedureOptions<T extends string> {
  path: T;
  headers: HeadersInit;
}
