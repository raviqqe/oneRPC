import { type GET } from "./api/foo/route.js";
import { query } from "onerpc/client.js";

export default async (): Promise<JSX.Element> => (
  <div>{await query<typeof GET>("/api/foo", 42)}</div>
);
