import { expect, it } from "vitest";
import { GET, POST } from "./route.js";

it("queries", async () => {
  expect(
    await (await GET(new Request("https://foo.com?input=42"))).json(),
  ).toEqual(42 * 42);
});

it("mutates", async () => {
  expect(
    await (
      await POST(new Request("https://foo.com", { body: "42", method: "post" }))
    ).json(),
  ).toEqual(42 * 42);
});
