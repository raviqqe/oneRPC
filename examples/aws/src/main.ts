import { App } from "aws-cdk-lib";
import { MainStack } from "./main-stack.js";

const app = new App();
new MainStack(app, "MainStack");
