import { expect, it } from "vitest";
import { etag } from "./etag.js";

const url = "https://foo.com";

const generateEtag = async (
  body: unknown,
  options: { mutate: boolean; stream: boolean } = {
    mutate: false,
    stream: false,
  },
) =>
  (
    await etag()(
      new Request(url),
      async () => new Response(JSON.stringify(body)),
      options,
    )
  ).headers.get("etag");

it("generates an etag", async () => {
  expect(await generateEtag({})).toMatch(/^"[^"]+"$/);
});

it("generates a weak etag", async () => {
  expect(
    (
      await etag({ weak: true })(
        new Request(url),
        async () => new Response(JSON.stringify({})),
        { mutate: false, stream: false },
      )
    ).headers.get("etag"),
  ).toMatch(/^W\/"[^"]+"$/);
});

it("checks an etag in a request", async () => {
  const generateEtag = (tag: string) =>
    etag()(
      // eslint-disable-next-line @typescript-eslint/naming-convention
      new Request(url, { headers: { "if-none-match": tag } }),
      async () => new Response(JSON.stringify({})),
      { mutate: false, stream: false },
    );

  const tag = (await generateEtag('""')).headers.get("etag");
  const response = await generateEtag(tag!);

  expect(response.status).toBe(304);
  expect(response.body).toBe(null);
});

it("generates an etag for the same bodies", async () => {
  expect(await generateEtag({ foo: 0 })).toBe(await generateEtag({ foo: 0 }));
});

it("generates an etag for different bodies", async () => {
  expect(await generateEtag({ foo: 0 })).not.toBe(
    await generateEtag({ foo: 1 }),
  );
});

it("generates an etag for mutation", async () => {
  expect(await generateEtag({}, { mutate: false, stream: false })).toBeTruthy();
});

it("generates no etag for stream", async () => {
  expect(await generateEtag({}, { mutate: false, stream: true })).toBeNull();
});
