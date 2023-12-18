import { mutate, query } from "onerpc";
import { number } from "valibot";

export const runtime = "edge";

export const GET = query(number(), number(), (input) => input * input);

export const POST = mutate(number(), number(), (input) => input * input);
