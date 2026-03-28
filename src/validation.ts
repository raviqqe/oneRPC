import { type BaseIssue, type BaseSchema, parse } from "valibot";
import type { ZodType } from "zod";
import type { Validator } from "./index.js";

export const valibot =
  <T>(schema: BaseSchema<T, T, BaseIssue<unknown>>): Validator<T> =>
  (value) =>
    parse(schema, value);

export const zod =
  <T>(type: ZodType<T>): Validator<T> =>
  (value) =>
    type.parse(value);
