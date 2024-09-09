import { type BaseIssue, type BaseSchema, parse } from "valibot";
import { type ZodType } from "zod";
import { type Validator } from "./main.js";

export const valibot =
  <T>(schema: BaseSchema<T, T, BaseIssue<unknown>>): Validator<T> =>
  (data) => parse(schema, data);

export const zod =
  <T>(type: ZodType<T>): Validator<T> =>
  (data) =>
    type.parse(data);
