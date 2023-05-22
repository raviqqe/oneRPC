import { type QueryRequestHandler } from "./main.js";

export const query = async <T extends QueryRequestHandler<unknown, unknown>>(
  path: string,
  input: T["_input"]
): Promise<T["_output"]> => {
  const parameters = new URLSearchParams({
    input: encodeURIComponent(JSON.stringify(input)),
  }).toString();
  const response = await fetch(new Request(`${path}?${parameters}`));

  return (await response.json()) as T["_output"];
};
