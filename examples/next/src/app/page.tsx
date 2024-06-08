import { Client } from "onerpc/client";
import { type GET } from "./api/foo/route.js";

const client = new Client({
  baseUrl: "https://onerpc.vercel.app",
});

export default async (): Promise<JSX.Element> => (
  <div>{await client.query<typeof GET>("/api/foo", 42)}</div>
);
