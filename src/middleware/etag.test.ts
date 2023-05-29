import { expect, it } from "vitest";
import { etag } from "./etag.js";

it("attaches etag", async () => {
  expect(
    (
      await etag(
        new Request("https:/foo.com"),
        async () => new Response(JSON.stringify({})),
        {
          mutate: false,
          stream: false,
        }
      )
    ).headers.get("etag")
  ).toBeTruthy();
});
