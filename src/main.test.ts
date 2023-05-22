import { map, toArray } from "@raviqqe/hidash/promise.js";
import { toIterable, toStringStream } from "@raviqqe/hidash/stream.js";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { mutate, query } from "./main.js";

for (const [procedure, buildRequest] of [
  [
    query,
    (value: unknown) =>
      new Request(
        `https://foo.com?input=${encodeURIComponent(JSON.stringify(value))}`
      ),
  ] as const,
  [
    mutate,
    (value: unknown) =>
      new Request("https://foo.com", {
        body: JSON.stringify(value),
        method: "POST",
      }),
  ] as const,
]) {
  describe(procedure.name, () => {
    it("handles a JSON object", async () => {
      const value = { foo: 42 };

      const response = await procedure(
        z.any(),
        z.any(),
        (value: object) => value
      )(buildRequest(value));

      expect(await response.json()).toEqual(value);
    });

    it("handles null", async () => {
      const response = await procedure(
        z.unknown(),
        z.null(),
        () => null
      )(buildRequest({}));

      expect(await response.json()).toBe(null);
    });

    it("handles undefined", async () => {
      const response = await procedure(
        z.unknown(),
        z.undefined(),
        () => undefined
      )(buildRequest({}));

      expect(response.body).toBe(null);
    });

    it("handles async iterable", async () => {
      const value = { foo: 42 };

      const response = await procedure(z.any(), z.any(), async function* () {
        yield value;
        yield value;
      })(buildRequest({}));

      expect(
        await toArray(
          map(toIterable(toStringStream(response.body!)), JSON.parse)
        )
      ).toEqual([value, value]);
    });
  });
}
