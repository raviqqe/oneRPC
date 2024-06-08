import { type BaseSchema, parse, type BaseIssue } from "valibot";
import { Validator } from "./main.js";

export const valibot =
  <T>(schema: BaseSchema<T, T, BaseIssue<unknown>>): Validator<T> =>
  (data) => {
    return parse(schema, data);
  };

export const zod =
  <T>(type: ZodType<T>): Validator<T> =>
  (data) =>
    validator.parse(data);
