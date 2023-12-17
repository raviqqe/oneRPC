import { App } from "aws-cdk-lib";
import { MainStack } from "./stack.js";

new MainStack(new App(), "Stack");
