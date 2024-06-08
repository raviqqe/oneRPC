import { query } from "onerpc";
import { awsLambda } from "onerpc/adapter/aws-lambda";
import { valibot } from "onerpc/validation";
import { number } from "valibot";

export const handler = awsLambda(
  query(valibot(number()), valibot(number()), (input) => input * input),
);
