import { filterValues } from "@raviqqe/loscore";
import { isString } from "es-toolkit";
import { collectString, toIterable } from "@raviqqe/loscore/async";

import type { LambdaFunctionURLHandler } from "aws-lambda";
import type { RequestHandler } from "../index.js";

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
          ? await collectString(
            toIterable(response.body.pipeThrough(new TextDecoderStream())),
          )
          : undefined,
        headers: Object.fromEntries(response.headers.entries()),
        statusCode: response.status,
      };
    };
