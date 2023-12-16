import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { RequestHandler } from "../main.js";
import {
  collectString,
  toIterable,
  toStringStream,
} from "@raviqqe/loscore/async";
import { isString, filterValues } from "@raviqqe/loscore";

export const awsLambda =
  (handler: RequestHandler): APIGatewayProxyHandlerV2 =>
  async ({ body, headers, requestContext: { http } }) => {
    const response = await handler(
      new Request(new URL(http.path), {
        method: http.method,
        body,
        headers: filterValues(headers, isString),
      }),
    );

    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: response.body
        ? await collectString(toIterable(toStringStream(response.body)))
        : undefined,
    };
  };
