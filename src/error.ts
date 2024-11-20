export class RpcError extends Error {
  public readonly status?: number;

  constructor(message?: string, options?: ErrorOptions & { status?: number }) {
    super(message, options);

    this.status = options?.status;
  }
}
