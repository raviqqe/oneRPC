import { mutate, query } from "onerpc";
import { object, string } from "valibot";

export const runtime = "edge";

export const GET = query(
  object({ name: string() }),
  object({ message: string() }),
  ({ name }) => ({ message: `Hello, ${name}!` }),
);

export const POST = mutate(
  object({ name: string() }),
  object({ message: string() }),
  ({ name }) => ({ message: `こんにちは, ${name}!` }),
);
