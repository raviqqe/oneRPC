import { expect, it } from "vitest";
import { etag } from "./etag.js";

const url = "https://foo.com";

const generateEtag = async (body: unknown) =>
  (
    await etag(
      new Request(url),
      async () => new Response(JSON.stringify(body)),
      {
        mutate: false,
        stream: false,
      }
    )
  ).headers.get("etag");

it("generates etag", async () => {
  expect(
    (
      await etag(
        new Request(url),
        async () => new Response(JSON.stringify({})),
        {
          mutate: false,
          stream: false,
        }
      )
    ).headers.get("etag")
  ).toBeTruthy();
});

it("generates etag for the same bodies", async () => {
  expect(await generateEtag({ foo: 0 })).toBe(await generateEtag({ foo: 0 }));
});

it("generates etag for different bodies", async () => {
  expect(await generateEtag({ foo: 0 })).not.toBe(
    await generateEtag({ foo: 1 })
  );
});

it("generates etag for mutation", async () => {
  expect(
    (
      await etag(
        new Request(url),
        async () => new Response(JSON.stringify({})),
        {
          mutate: true,
          stream: false,
        }
      )
    ).headers.get("etag")
  ).toBeTruthy();
});

it("generates no etag for stream", async () => {
  expect(
    (
      await etag(
        new Request(url),
        async () => new Response(JSON.stringify({})),
        {
          mutate: false,
          stream: true,
        }
      )
    ).headers.get("etag")
  ).toBeNull();
});
