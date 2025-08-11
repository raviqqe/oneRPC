export class RpcError extends Error {
  public readonly status?: number;

  public constructor(
    message?: string,
    options?: ErrorOptions & { status?: number },
  ) {
    super(message, options);

    this.status = options?.status;
  }
}
