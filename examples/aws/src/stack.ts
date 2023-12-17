import { CfnOutput, Fn, Stack, type StackProps } from "aws-cdk-lib";
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginRequestPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { type Construct } from "constructs";

export class MainStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambda = new NodejsFunction(this, "Function", {
      entry: "src/lambda/square.ts",
      runtime: Runtime.NODEJS_LATEST,
      bundling: { minify: true },
    });
    const url = lambda.addFunctionUrl({ authType: FunctionUrlAuthType.NONE });

    const distribution = new Distribution(this, "Distribution", {
      defaultBehavior: {
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        origin: new HttpOrigin(Fn.parseDomainName(url.url)),
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
      enableLogging: true,
    });

    new CfnOutput(this, "Domain", {
      value: distribution.domainName,
    });
  }
}
