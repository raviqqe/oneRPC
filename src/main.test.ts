import { map, toArray } from "@raviqqe/hidash/promise.js";
import { toIterable, toStringStream } from "@raviqqe/hidash/stream.js";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { UserError, mutate, query, queryStream } from "./main.js";

const buildQueryRequest = (value: unknown) =>
  new Request(
    `https://foo.com?input=${encodeURIComponent(JSON.stringify(value))}`
  );

for (const [procedure, buildRequest] of [
  [query, buildQueryRequest] as const,
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
        z.object({ foo: z.number() }),
        z.object({ foo: z.number() }),
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

    it("handles a user error", async () => {
      const response = await procedure(z.unknown(), z.never(), () => {
        throw new UserError();
      })(buildRequest({}));

      expect(response.status).toBe(400);
    });

    it("handles an unexpected error", async () => {
      const response = await procedure(z.unknown(), z.never(), () => {
        throw new Error();
      })(buildRequest({}));

      expect(response.status).toBe(500);
    });
  });
}

describe(queryStream.name, () => {
  it("handles async iterable", async () => {
    const value = { foo: 42 };

    const response = await queryStream(
      z.unknown(),
      z.any(),
      async function* () {
        yield value;
        yield value;
      }
    )(buildQueryRequest({}));

    expect(
      await toArray(map(toIterable(toStringStream(response.body!)), JSON.parse))
    ).toEqual([value, value]);
  });

  it("handles a user error", async () => {
    const response = await queryStream(z.unknown(), z.never(), () => {
      throw new UserError();
    })(buildQueryRequest({}));

    expect(response.status).toBe(400);
  });

  it("handles an unexpected error", async () => {
    const response = await queryStream(z.unknown(), z.never(), () => {
      throw new Error();
    })(buildQueryRequest({}));

    expect(response.status).toBe(500);
  });
});