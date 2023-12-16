import { map } from "@raviqqe/loscore";
import {
  collectString,
  toIterable,
  toStringStream,
} from "@raviqqe/loscore/async";
import {
  type CloudFrontRequestHandler,
  type CloudFrontResultResponse,
} from "aws-lambda";
import { type RequestHandler } from "../main.js";

export const awsLambda =
  (handler: RequestHandler): CloudFrontRequestHandler =>
  async ({ Records: [record] }) => {
    if (!record) {
      throw new Error("Invalid record in CloudFront event");
    }

    const { request } = record.cf;

    const headers = new Headers();

    for (const [key, values] of Object.entries(request.headers)) {
      for (const value of values) {
        headers.append(key, value.value);
      }
    }

    const response = await handler(
      new Request(new URL(request.uri), {
        body: request.body?.data,
        headers,
        method: request.method,
      }),
    );

    return {
      body: response.body
        ? await collectString(toIterable(toStringStream(response.body)))
        : undefined,
      headers: Object.fromEntries(
        map(response.headers.entries(), ([key, value]) => [key, [{ value }]]),
      ),
      status: response.status.toString(),
    } satisfies CloudFrontResultResponse;
  };
