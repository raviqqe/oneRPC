import { mutate, query } from "onerpc";
import { number } from "valibot";

const path = "/api/foo";

export const runtime = "edge";

export const GET = query(number(), number(), (input) => input * input, {
  path,
});

export const POST = mutate(number(), number(), (input) => input * input, {
  path,
});
