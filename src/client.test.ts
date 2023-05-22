import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import * as server from "./main.js";
import { query } from "./client.js";

describe(query.name, () => {
  const mockFetch = (query: server.QueryRequestHandler<unknown, unknown>) =>
    vi
      .spyOn(global, "fetch")
      .mockImplementation((request) =>
        query(request instanceof Request ? request : new Request(request))
      );

  beforeEach(() => {});

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
});

// describe(queryStream.name, () => {
//   it("handles async iterable", async () => {
//     const value = { foo: 42 };

//     const response = await queryStream(
//       z.unknown(),
//       z.any(),
//       async function* () {
//         yield value;
//         yield value;
//       }
//     )(buildQueryRequest({}));

//     expect(
//       await toArray(map(toIterable(toStringStream(response.body!)), JSON.parse))
//     ).toEqual([value, value]);
//   });
// });
