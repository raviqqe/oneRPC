import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Client, mutate, query, queryStream } from "./client.js";
import * as server from "./index.js";
import { zod } from "./validation.js";

const stubFetch = <T>(handle: (request: Request) => T) =>
  vi.stubGlobal("fetch", (...[request]: Parameters<typeof fetch>) =>
    handle(request instanceof Request ? request : new Request(request)),
  );

describe(query.name, () => {
  const mockFetch = (query: server.QueryRequestHandler<unknown, unknown>) =>
    stubFetch(query);

  it("handles a JSON object", async () => {
    const value = { foo: 42 };
    const serverQuery = server.query(
      zod(z.object({ foo: z.number() })),
      zod(z.any()),
      (x: typeof value) => x,
    );
    mockFetch(serverQuery);

    expect(
      await query<typeof serverQuery>("https://foo.com/foo", value),
    ).toEqual(value);
  });

  it("handles null", async () => {
    const serverQuery = server.query(
      zod(z.null()),
      zod(z.any()),
      (x: null) => x,
    );
    mockFetch(serverQuery);

    expect(await query<typeof serverQuery>("https://foo.com/foo", null)).toBe(
      null,
    );
  });

  it("handles options", async () => {
    const serverQuery = server.query(
      zod(z.null()),
      zod(z.any()),
      (_: null, request: Request) => ({ hello: request.headers.get("hello") }),
    );
    mockFetch(serverQuery);

    expect(
      await query<typeof serverQuery>("https://foo.com/foo", null, {
        headers: { hello: "world" },
      }),
    ).toEqual({ hello: "world" });
  });

  it("specifies a path", async () => {
    const serverQuery = server.query(
      zod(z.null()),
      zod(z.any()),
      (x: null) => x,
      {
        path: "https://foo.com/bar",
      },
    );
    mockFetch(serverQuery);

    expect(await query<typeof serverQuery>("https://foo.com/bar", null)).toBe(
      null,
    );
  });

  it("handles an error", async () => {
    const serverQuery = server.query(
      zod(z.unknown()),
      zod(z.any()),
      () => {
        throw new Error("foo");
      },
      { path: "https://foo.com/bar" },
    );
    mockFetch(serverQuery);

    await expect(
      query<typeof serverQuery>("https://foo.com/bar", null),
    ).rejects.toThrowError("foo");
  });

  it("handles undefined input", async () => {
    const serverQuery = server.query(zod(z.void()), zod(z.any()), () => null);
    mockFetch(serverQuery);

    expect(
      await query<typeof serverQuery>("https://foo.com/foo", undefined),
    ).toBe(null);
  });

  it("handles undefined output", async () => {
    const serverQuery = server.query(
      zod(z.null()),
      zod(z.void()),
      () => undefined,
    );
    mockFetch(serverQuery);

    expect(await query<typeof serverQuery>("https://foo.com/foo", null)).toBe(
      undefined,
    );
  });

  it("resolves a URL from a base URL", async () => {
    const baseUrl = "https://foo.com";
    const path = "/bar";

    const serverQuery = server.query(
      zod(z.null()),
      zod(z.null()),
      async (_: null, request: Request) => {
        const url = new URL(request.url);

        if (url.origin !== baseUrl || url.pathname !== path) {
          throw new Error();
        }

        return null;
      },
    );
    mockFetch(serverQuery);

    expect(await query<typeof serverQuery>(path, null, { baseUrl })).toEqual(
      null,
    );
  });

  it("handles dynamic options", async () => {
    const serverQuery = server.query(
      zod(z.null()),
      zod(z.string()),
      (_: null, request: Request) => request.headers.get("value"),
    );
    mockFetch(serverQuery);

    let value = 0;
    const client = new Client(() => ({
      headers: { value: (value++).toString() },
    }));

    expect([
      await client.query<typeof serverQuery>("https://foo.com/foo", null),
      await client.query<typeof serverQuery>("https://foo.com/foo", null),
      await client.query<typeof serverQuery>("https://foo.com/foo", null),
    ]).toEqual(["0", "1", "2"]);
  });
});

describe(mutate.name, () => {
  const mockFetch = (mutate: server.MutateRequestHandler<unknown, unknown>) =>
    stubFetch(mutate);

  it("handles a JSON object", async () => {
    const value = { foo: 42 };
    const serverMutate = server.mutate(
      zod(z.object({ foo: z.number() })),
      zod(z.any()),
      (x: typeof value) => x,
    );
    mockFetch(serverMutate);

    expect(
      await mutate<typeof serverMutate>("https://foo.com/foo", value),
    ).toEqual(value);
  });

  it("handles null", async () => {
    const serverMutate = server.mutate(
      zod(z.null()),
      zod(z.any()),
      (x: null) => x,
    );
    mockFetch(serverMutate);

    expect(await mutate<typeof serverMutate>("https://foo.com/foo", null)).toBe(
      null,
    );
  });

  it("handles options", async () => {
    const serverMutate = server.mutate(
      zod(z.null()),
      zod(z.any()),
      (_: null, request: Request) => ({ hello: request.headers.get("hello") }),
    );
    mockFetch(serverMutate);

    expect(
      await mutate<typeof serverMutate>("https://foo.com/foo", null, {
        headers: { hello: "world" },
      }),
    ).toEqual({ hello: "world" });
  });

  it("handles an error", async () => {
    const serverMutate = server.mutate(
      zod(z.unknown()),
      zod(z.any()),
      () => {
        throw new Error("foo");
      },
      { path: "https://foo.com/bar" },
    );
    mockFetch(serverMutate);

    await expect(
      mutate<typeof serverMutate>("https://foo.com/bar", null),
    ).rejects.toThrowError("foo");
  });

  it("handles undefined input", async () => {
    const serverMutate = server.mutate(zod(z.void()), zod(z.any()), () => null);
    mockFetch(serverMutate);

    expect(
      await mutate<typeof serverMutate>("https://foo.com/foo", undefined),
    ).toBe(null);
  });

  it("handles undefined output", async () => {
    const serverMutate = server.mutate(
      zod(z.null()),
      zod(z.void()),
      () => undefined,
    );
    mockFetch(serverMutate);

    expect(await mutate<typeof serverMutate>("https://foo.com/foo", null)).toBe(
      undefined,
    );
  });

  it("resolves a URL from a base URL", async () => {
    const baseUrl = "https://foo.com";
    const path = "/bar";

    const serverMutate = server.mutate(
      zod(z.null()),
      zod(z.null()),
      async (_: null, request: Request) => {
        const url = new URL(request.url);

        if (url.origin !== baseUrl || url.pathname !== path) {
          throw new Error();
        }

        return null;
      },
    );
    mockFetch(serverMutate);

    expect(await mutate<typeof serverMutate>(path, null, { baseUrl })).toEqual(
      null,
    );
  });

  it("handles dynamic options", async () => {
    const serverMutate = server.mutate(
      zod(z.null()),
      zod(z.string()),
      (_: null, request: Request) => request.headers.get("value"),
    );
    mockFetch(serverMutate);

    let value = 0;
    const client = new Client(() => ({
      headers: { value: (value++).toString() },
    }));

    expect([
      await client.mutate<typeof serverMutate>("https://foo.com/foo", null),
      await client.mutate<typeof serverMutate>("https://foo.com/foo", null),
      await client.mutate<typeof serverMutate>("https://foo.com/foo", null),
    ]).toEqual(["0", "1", "2"]);
  });
});

describe(queryStream.name, () => {
  const mockFetch = (
    query: server.QueryStreamRequestHandler<unknown, unknown>,
  ) => stubFetch(query);

  it("handles a JSON object", async () => {
    const value = { foo: 42 };
    const serverQuery = server.queryStream(
      zod(z.object({ foo: z.number() })),
      zod(z.any()),
      async function*() {
        yield value;
        yield value;
      },
    );
    mockFetch(serverQuery);

    expect(
      await Array.fromAsync(
        queryStream<typeof serverQuery>("https://foo.com/foo", value),
      ),
    ).toEqual([value, value]);
  });

  it("handles options", async () => {
    const serverQuery = server.queryStream(
      zod(z.null()),
      zod(z.string()),
      async function*(_: null, request: Request) {
        yield request.headers.get("hello");
      },
    );
    mockFetch(serverQuery);

    expect(
      await Array.fromAsync(
        queryStream<typeof serverQuery>("https://foo.com/foo", null, {
          headers: { hello: "world" },
        }),
      ),
    ).toEqual(["world"]);
  });

  it("handles an error", async () => {
    const serverQuery = server.queryStream(
      zod(z.unknown()),
      zod(z.any()),
      () => {
        throw new Error("foo");
      },
      { path: "https://foo.com/bar" },
    );
    mockFetch(serverQuery);

    await expect(
      Array.fromAsync(
        queryStream<typeof serverQuery>("https://foo.com/bar", null),
      ),
    ).rejects.toThrowError("foo");
  });

  it("resolves a URL from a base URL", async () => {
    const baseUrl = "https://foo.com";
    const path = "/bar";

    const serverQuery = server.queryStream(
      zod(z.null()),
      zod(z.null()),
      // biome-ignore lint/correctness/useYield: A test function
      async function*(_: null, request: Request) {
        const url = new URL(request.url);

        if (url.origin !== baseUrl || url.pathname !== path) {
          throw new Error();
        }
      },
    );
    mockFetch(serverQuery);

    expect(
      await Array.fromAsync(
        queryStream<typeof serverQuery>(path, null, { baseUrl }),
      ),
    ).toEqual([]);
  });
});
