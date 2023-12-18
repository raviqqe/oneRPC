import { Client } from "onerpc/client.js";
import { type GET } from "./api/foo/route.js";

const client = new Client({
  baseUrl: process.env.VERCEL_URL ?? "http://localhost:3000",
});

export default async (): Promise<JSX.Element> => (
  <div>{await client.query<typeof GET>("/api/foo", 42)}</div>
);
