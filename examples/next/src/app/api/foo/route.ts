import { object, string } from "valibot";
import { query } from "onerpc";

export const runtime = "edge";

export const GET = query(
  object({ name: string() }),
  object({ message: string() }),
  ({ name }) => ({ message: `Hello, ${name}!` }),
);
