import { CfnOutput, Stack, type StackProps } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  AllowedMethods,
  Distribution,
  FunctionEventType,
} from "aws-cdk-lib/aws-cloudfront";
import { type Construct } from "constructs";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Runtime } from "aws-cdk-lib/aws-lambda";

export class MainStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambda = new NodejsFunction(this, "Function", {
      entry: "src/lambda/square.ts",
      runtime: Runtime.NODEJS_LATEST,
    });

    const distribution = new Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new HttpOrigin("onerpc.raviqqe.com"),
        allowedMethods: AllowedMethods.ALLOW_ALL,
        functionAssociations: [
          {
            function: lambda,
            eventType: FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
    });

    new CfnOutput(this, "DistributionDomain", {
      value: distribution.domainName,
    });
  }
}
