import { CloudFrontRequestHandler, CloudFrontResultResponse } from "aws-lambda";
import { RequestHandler } from "../main.js";
import {
  collectString,
  toIterable,
  toStringStream,
} from "@raviqqe/loscore/async";
import { map } from "@raviqqe/loscore";

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
        method: request.method,
        body: request.body?.data,
        headers,
      }),
    );

    return {
      status: response.status.toString(),
      headers: Object.fromEntries(
        map(response.headers.entries(), ([key, value]) => [key, [{ value }]]),
      ),
      body: response.body
        ? await collectString(toIterable(toStringStream(response.body)))
        : undefined,
    } satisfies CloudFrontResultResponse;
  };
