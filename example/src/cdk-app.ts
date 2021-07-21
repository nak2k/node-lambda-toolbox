#!/usr/bin/env node
import { App } from "@aws-cdk/core";
import { LambdaToolboxExampleStack } from "./LambdaToolboxExampleStack";

const app = new App();

new LambdaToolboxExampleStack(app, `LambdaToolboxExampleStack`);
