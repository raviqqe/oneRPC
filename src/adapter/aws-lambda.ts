import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { RequestHandler } from "../main.js";
import { toString, toStringStream } from "@raviqqe/loscore/async";

export const awsLambda =
  (handler: RequestHandler): APIGatewayProxyHandlerV2 =>
  async (event) => {
    const response = await handler(new Request({}));

    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: response.body
        ? await toString(toStringStream(response.body))
        : undefined,
    };
  };
