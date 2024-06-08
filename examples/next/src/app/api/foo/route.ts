import { mutate, query } from "onerpc";
import { valibot } from "onerpc/validation";
import { number } from "valibot";

const path = "/api/foo";

export const runtime = "edge";

export const GET = query(
  valibot(number()),
  valibot(number()),
  (input) => input * input,
  {
    path,
  },
);

export const POST = mutate(
  valibot(number()),
  valibot(number()),
  (input) => input * input,
  {
    path,
  },
);
