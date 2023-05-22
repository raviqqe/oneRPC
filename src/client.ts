import { type RequestHandler } from "./main.js";

export const call = <T extends RequestHandler<unknown, unknown>>(input: T): S =>
  undefined;
