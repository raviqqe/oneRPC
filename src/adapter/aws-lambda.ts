import { filterValues, isString } from "@raviqqe/loscore";
import {
  collectString,
  toIterable,
  toStringStream,
} from "@raviqqe/loscore/async";
import { type LambdaFunctionURLHandler } from "aws-lambda";
import { type RequestHandler } from "../main.js";

export const awsLambda =
  (handler: RequestHandler): LambdaFunctionURLHandler =>
  async (request) => {
    const url = new URL("http://localhost");

    url.hostname = request.requestContext.domainName;
    url.pathname = request.rawPath;
    url.search = request.rawQueryString;

    const response = await handler(
      new Request(url, {
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
