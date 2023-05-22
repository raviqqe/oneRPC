export const rpc = <T, S>(
  _handle: (input: T) => S
): ((request: Request) => Response) => undefined as never;
