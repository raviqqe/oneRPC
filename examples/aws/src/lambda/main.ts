import { type Handler } from "aws-lambda";
import { query } from "onerpc";
import { awsLambda } from "onerpc/adapter/aws-lambda";
import { number } from "valibot";

export const handler: Handler = awsLambda(
  query(number(), number(), async (input) => input * input),
);
