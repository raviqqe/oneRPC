export interface ProcedureOptions<T extends string> {
  url: T;
  headers: HeadersInit;
}
