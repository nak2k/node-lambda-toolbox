#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { LambdaToolboxExampleStack } from "./LambdaToolboxExampleStack";

const app = new App();

new LambdaToolboxExampleStack(app, `LambdaToolboxExampleStack`);
