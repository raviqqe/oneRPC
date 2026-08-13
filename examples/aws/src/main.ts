import { App } from "aws-cdk-lib";
import { MainStack } from "./stack.ts";

new MainStack(new App(), "OnerpcStack");
