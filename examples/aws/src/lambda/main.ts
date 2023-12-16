import { type Handler } from "aws-lambda";
import { query } from "onerpc";
import { awsLambda } from "onerpc/adapter/aws-lambda";
import { number } from "valibot";

export const handler: Handler<number, number> = awsLambda(
  query(number(), number(), (input) => input * input),
);
