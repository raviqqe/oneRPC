import { query } from "onerpc";
import { awsLambda } from "onerpc/adapter/aws-lambda";
import { number } from "valibot";

export const handler = awsLambda(
  query(number(), number(), (input) => input * input),
);
