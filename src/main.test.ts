import { map, toArray } from "@raviqqe/hidash/promise";
import { toIterable, toStream, toStringStream } from "@raviqqe/hidash/stream";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { RpcError, Server, mutate, query, queryStream } from "./main.js";
import { etag } from "./middleware.js";

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

    it("handles an RPC error", async () => {
      const response = await procedure(z.unknown(), z.never(), () => {
        throw new RpcError();
      })(buildRequest({}));

      expect(response.status).toBe(500);
    });

    it("handles an RPC error with status", async () => {
      const response = await procedure(z.unknown(), z.never(), () => {
        throw new RpcError(undefined, { status: 400 });
      })(buildRequest({}));

      expect(response.status).toBe(400);
    });

    it("handles an unexpected error", async () => {
      const response = await procedure(z.unknown(), z.never(), () => {
        throw new Error();
      })(buildRequest({}));

      expect(response.status).toBe(500);
    });

    it("attaches custom headers", async () => {
      const response = await procedure(z.unknown(), z.null(), () => null, {
        headers: { hello: "world" },
      })(buildRequest({}));

      expect(response.headers.get("hello")).toBe("world");
    });

    it("attaches custom headers in a Headers class", async () => {
      const response = await procedure(z.unknown(), z.null(), () => null, {
        headers: new Headers({ hello: "world" }),
      })(buildRequest({}));

      expect(response.headers.get("hello")).toBe("world");
    });

    it("applies no middleware", async () => {
      const response = await procedure(z.unknown(), z.string(), () => "foo", {
        middlewares: [],
      })(buildRequest({}));

      expect(await response.text()).toBe(JSON.stringify("foo"));
    });

    it("applies a middleware", async () => {
      const response = await procedure(z.unknown(), z.string(), () => "foo", {
        middlewares: [etag()],
      })(buildRequest({}));

      expect(await response.text()).toBe(JSON.stringify("foo"));
    });

    it("applies a middleware and attaches a custom header", async () => {
      const response = await procedure(z.unknown(), z.string(), () => "foo", {
        middlewares: [etag()],
        headers: { hello: "world" },
      })(buildRequest({}));

      expect(await response.text()).toBe(JSON.stringify("foo"));
      expect(response.headers.get("etag")).toBeTruthy();
      expect(response.headers.get("hello")).toBe("world");
    });
  });
}

describe(mutate.name, () => {
  it("handles a zero-length body", async () => {
    const options = {
      body: toStream((async function* () {})()),
      duplex: "half",
      method: "post",
    };
    const response = await mutate(z.void(), z.void(), () => {})(
      new Request("https://foo.com", options)
    );

    expect(response.status).toBe(200);
  });
});

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

  it("handles an RPC error", async () => {
    const response = await queryStream(z.unknown(), z.never(), () => {
      throw new RpcError();
    })(buildQueryRequest({}));

    expect(response.status).toBe(500);
  });

  it("handles an RPC error with status", async () => {
    const response = await queryStream(z.unknown(), z.never(), () => {
      throw new RpcError(undefined, { status: 400 });
    })(buildQueryRequest({}));

    expect(response.status).toBe(400);
  });

  it("handles an unexpected error", async () => {
    const response = await queryStream(z.unknown(), z.never(), () => {
      throw new Error();
    })(buildQueryRequest({}));

    expect(response.status).toBe(500);
  });

  it("attaches custom headers", async () => {
    const response = await queryStream(
      z.unknown(),
      z.any(),
      async function* () {},
      { headers: { hello: "world" } }
    )(buildQueryRequest({}));

    expect(response.headers.get("hello")).toBe("world");
  });
});

describe(Server.name, () => {
  const server = new Server();

  for (const [procedure, buildRequest] of [
    [server.query.bind(server), buildQueryRequest] as const,
    [
      server.mutate.bind(server),
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
    });
  }

  it("handles async iterable", async () => {
    const value = { foo: 42 };

    const response = await server.queryStream(
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
});
