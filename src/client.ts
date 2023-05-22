import { type QueryRequestHandler, type MutateRequestHandler } from "./main.js";

export const query = async <T extends QueryRequestHandler<unknown, unknown>>(
  path: string,
  input: T["_input"]
): Promise<T["_output"]> => {
  const parameters = new URLSearchParams({
    input: encodeURIComponent(JSON.stringify(input)),
  }).toString();

  return procedure(new Request(`${path}?${parameters}`));
};

export const mutate = async <T extends MutateRequestHandler<unknown, unknown>>(
  path: string,
  input: T["_input"]
): Promise<T["_output"]> => {
  return procedure(
    new Request(path, {
      body: JSON.stringify(input),
      headers: { "content-type": "application/json" },
    })
  );
};

const procedure = async <T extends MutateRequestHandler<unknown, unknown>>(
  request: Request
): Promise<T["_output"]> => {
  const response = await fetch(request);

  return (await response.json()) as T["_output"];
};
