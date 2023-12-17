import { filterValues, isString } from "@raviqqe/loscore";
import {
  collectString,
  toIterable,
  toStringStream,
} from "@raviqqe/loscore/async";
import { LambdaFunctionURLHandler } from "aws-lambda";
import { type RequestHandler } from "../main.js";

export const awsLambda =
  (handler: RequestHandler): LambdaFunctionURLHandler =>
  async (request) => {
    console.log(request.requestContext.http);

    const response = await handler(
      new Request(new URL(request.requestContext.http.path), {
        body: request.body,
        headers: new Headers(filterValues(request.headers, isString)),
        method: request.requestContext.http.method,
      }),
    );

    return {
      body: response.body
        ? await collectString(toIterable(toStringStream(response.body)))
        : undefined,
      headers: Object.fromEntries(response.headers.entries()),
      status: response.status.toString(),
    };
  };
