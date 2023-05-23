import { describe, expect, it } from "vitest";
import { RpcError } from "./error.js";

describe(RpcError.name, () => {
  it("is a correct instance", () => {
    expect(new RpcError() instanceof RpcError).toBe(true);
    expect(new RpcError() instanceof Error).toBe(true);
    expect(new Error() instanceof RpcError).toBe(false);
    expect(new Error() instanceof Error).toBe(true);
  });

  it("sets a status code", () => {
    expect(new RpcError(undefined, { status: 403 }).status).toBe(403);
  });
});
