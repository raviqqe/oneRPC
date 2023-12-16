import { CfnOutput, Fn, Stack, type StackProps } from "aws-cdk-lib";
import { AllowedMethods, Distribution } from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { type Construct } from "constructs";

export class MainStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambda = new NodejsFunction(this, "Function", {
      entry: "src/lambda/square.ts",
      runtime: Runtime.NODEJS_LATEST,
    });

    const distribution = new Distribution(this, "Distribution", {
      defaultBehavior: {
        allowedMethods: AllowedMethods.ALLOW_ALL,
        origin: new HttpOrigin(
          Fn.select(2, Fn.split("/", lambda.addFunctionUrl().url)),
        ),
      },
    });

    new CfnOutput(this, "Domain", {
      value: distribution.domainName,
    });
  }
}
