import { type BaseSchema, parse, type BaseIssue } from "valibot";
import { Validator } from "./main.js";

export const valibot =
  <T>(schema: BaseSchema<T, T, BaseIssue<unknown>>): Validator<T> =>
  (data) => {
    return parse(schema, data);
  };

export const zod = <T>(validator: Validator<T>, data: unknown): T => {
  if (validator instanceof Function) {
    return validator(data);
  } else if (validator instanceof ZodType) {
    return validator.parse(data);
  }

  return parse(validator, data);
};
