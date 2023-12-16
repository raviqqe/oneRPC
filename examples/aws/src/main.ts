import { App } from "aws-cdk-lib";
import { MainStack } from "./stack.js";

const app = new App();

new MainStack(app, "Stack");
