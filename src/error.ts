export class RpcError extends Error {
  public readonly status?: number;

  constructor(message?: string, options?: { status?: number } & ErrorOptions) {
    super(message, options);

    this.status = options?.status;
  }
}
