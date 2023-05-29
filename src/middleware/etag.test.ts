import { expect, it } from "vitest";
import { etag } from "./etag.js";

const url = "https://foo.com";

const generateEtag = async (
  body: unknown,
  options: { mutate: boolean; stream: boolean } = {
    mutate: false,
    stream: false,
  }
) =>
  (
    await etag()(
      new Request(url),
      async () => new Response(JSON.stringify(body)),
      options
    )
  ).headers.get("etag");

it("generates etag", async () => {
  expect(await generateEtag({})).toMatch(/^"[^"]+"$/);
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
  expect(await generateEtag({}, { mutate: false, stream: false })).toBeTruthy();
});

it("generates no etag for stream", async () => {
  expect(await generateEtag({}, { mutate: false, stream: true })).toBeNull();
});
