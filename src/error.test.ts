import { describe, expect, it } from "vitest";
import { UserError } from "./error.js";

describe(UserError.name, () => {
  it("is a correct instance", () => {
    expect(new UserError() instanceof UserError).toBe(true);
    expect(new UserError() instanceof Error).toBe(true);
    expect(new Error() instanceof UserError).toBe(false);
    expect(new Error() instanceof Error).toBe(true);
  });
});
