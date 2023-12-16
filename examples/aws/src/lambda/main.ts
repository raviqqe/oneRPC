import { Handler } from "aws-lambda";
import { awsLambda } from "onerpc/adapter/aws-lambda";
import { query } from "onerpc";
import { number } from "valibot";

export const handler: Handler = awsLambda(
  query(number(), number(), async (input) => input * input),
);
