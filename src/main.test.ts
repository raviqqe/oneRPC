import { describe, expect, it } from "vitest";
import { z } from "zod";
import { query } from "./main.js";

describe(query.name, () => {
  it("handles a JSON object", async () => {
    const value = { foo: 42 };

    const response = await query(
      z.any(),
      z.any(),
      (value: object) => value
    )(
      new Request(
        `https://foo.com?input=${encodeURIComponent(JSON.stringify(value))}`
      )
    );

    expect(await response.json()).toEqual(value);
  });

  it("handles null", async () => {
    const response = await query(
      z.any(),
      z.any(),
      () => null
    )(
      new Request(
        `https://foo.com?input=${encodeURIComponent(JSON.stringify({}))}`
      )
    );

    expect(await response.json()).toBe(null);
  });

  it("handles undefined", async () => {
    const response = await query(
      z.any(),
      z.any(),
      () => undefined
    )(
      new Request(
        `https://foo.com?input=${encodeURIComponent(JSON.stringify({}))}`
      )
    );

    expect(response.body).toBe(null);
  });
});
