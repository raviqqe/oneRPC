import { type GET } from "./api/foo/route.js";
import { Client } from "onerpc/client.js";

const client = new Client({
  baseUrl: process.env.VERCEL_URL ?? "http://localhost",
});

export default async (): Promise<JSX.Element> => (
  <div>{await client.query<typeof GET>("/api/foo", 42)}</div>
);
