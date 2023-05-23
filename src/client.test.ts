import { toArray } from "@raviqqe/hidash/promise.js";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { mutate, query, queryStream } from "./client.js";
import * as server from "./main.js";

describe(query.name, () => {
  const mockFetch = (query: server.QueryRequestHandler<unknown, unknown>) =>
    vi
      .spyOn(global, "fetch")
      .mockImplementation((request) =>
        query(request instanceof Request ? request : new Request(request))
      );

  it("handles a JSON object", async () => {
    const value = { foo: 42 };
    const serverQuery = server.query(
      z.object({ foo: z.number() }),
      z.any(),
      (x: typeof value) => x
    );
    mockFetch(serverQuery);

    expect(
      await query<typeof serverQuery>("https://foo.com/foo", value)
    ).toEqual(value);
  });

  it("handles null", async () => {
    const serverQuery = server.query(z.null(), z.any(), (x: null) => x);
    mockFetch(serverQuery);

    expect(await query<typeof serverQuery>("https://foo.com/foo", null)).toBe(
      null
    );
  });

  it("handles options", async () => {
    const serverQuery = server.query(
      z.null(),
      z.any(),
      (_: null, request: Request) => ({ hello: request.headers.get("hello") })
    );
    mockFetch(serverQuery);

    expect(
      await query<typeof serverQuery>("https://foo.com/foo", null, {
        headers: { hello: "world" },
      })
    ).toEqual({ hello: "world" });
  });

  it("specifies a path", async () => {
    const serverQuery = server.query(z.null(), z.any(), (x: null) => x, {
      path: "https://foo.com/bar",
    });
    mockFetch(serverQuery);

    expect(await query<typeof serverQuery>("https://foo.com/bar", null)).toBe(
      null
    );
  });

  it("handles an error", async () => {
    const serverQuery = server.query(
      z.unknown(),
      z.any(),
      () => {
        throw new Error("foo");
      },
      { path: "https://foo.com/bar" }
    );
    mockFetch(serverQuery);

    await expect(
      query<typeof serverQuery>("https://foo.com/bar", null)
    ).rejects.toThrowError("foo");
  });
});

describe(mutate.name, () => {
  const mockFetch = (mutate: server.MutateRequestHandler<unknown, unknown>) =>
    vi
      .spyOn(global, "fetch")
      .mockImplementation((request) =>
        mutate(request instanceof Request ? request : new Request(request))
      );

  it("handles a JSON object", async () => {
    const value = { foo: 42 };
    const serverMutate = server.mutate(
      z.object({ foo: z.number() }),
      z.any(),
      (x: typeof value) => x
    );
    mockFetch(serverMutate);

    expect(
      await mutate<typeof serverMutate>("https://foo.com/foo", value)
    ).toEqual(value);
  });

  it("handles null", async () => {
    const serverMutate = server.mutate(z.null(), z.any(), (x: null) => x);
    mockFetch(serverMutate);

    expect(await mutate<typeof serverMutate>("https://foo.com/foo", null)).toBe(
      null
    );
  });

  it("handles options", async () => {
    const serverMutate = server.mutate(
      z.null(),
      z.any(),
      (_: null, request: Request) => ({ hello: request.headers.get("hello") })
    );
    mockFetch(serverMutate);

    expect(
      await mutate<typeof serverMutate>("https://foo.com/foo", null, {
        headers: { hello: "world" },
      })
    ).toEqual({ hello: "world" });
  });

  it("handles an error", async () => {
    const serverMutate = server.mutate(
      z.unknown(),
      z.any(),
      () => {
        throw new Error("foo");
      },
      { path: "https://foo.com/bar" }
    );
    mockFetch(serverMutate);

    await expect(
      mutate<typeof serverMutate>("https://foo.com/bar", null)
    ).rejects.toThrowError("foo");
  });

  it("handles undefined input", async () => {
    const serverMutate = server.mutate(z.void(), z.any(), () => null);
    mockFetch(serverMutate);

    expect(
      await mutate<typeof serverMutate>("https://foo.com/foo", undefined)
    ).toBe(null);
  });
});

describe(queryStream.name, () => {
  const mockFetch = (
    query: server.QueryStreamRequestHandler<unknown, unknown>
  ) =>
    vi
      .spyOn(global, "fetch")
      .mockImplementation((request) =>
        query(request instanceof Request ? request : new Request(request))
      );

  it("handles a JSON object", async () => {
    const value = { foo: 42 };
    const serverQuery = server.queryStream(
      z.object({ foo: z.number() }),
      z.any(),
      async function* () {
        yield value;
        yield value;
      }
    );
    mockFetch(serverQuery);

    expect(
      await toArray(
        queryStream<typeof serverQuery>("https://foo.com/foo", value)
      )
    ).toEqual([value, value]);
  });

  it("handles options", async () => {
    const serverQuery = server.queryStream(
      z.null(),
      z.string(),
      async function* (_: null, request: Request) {
        yield request.headers.get("hello");
      }
    );
    mockFetch(serverQuery);

    expect(
      await toArray(
        queryStream<typeof serverQuery>("https://foo.com/foo", null, {
          headers: { hello: "world" },
        })
      )
    ).toEqual(["world"]);
  });

  it("handles an error", async () => {
    const serverQuery = server.queryStream(
      z.unknown(),
      z.any(),
      () => {
        throw new Error("foo");
      },
      { path: "https://foo.com/bar" }
    );
    mockFetch(serverQuery);

    await expect(
      toArray(queryStream<typeof serverQuery>("https://foo.com/bar", null))
    ).rejects.toThrowError("foo");
  });
});
