import { Construct } from "@aws-cdk/core";
import { DefaultEnvStack } from "@cdk-util/core";
import { LambdaRestApi } from "@aws-cdk/aws-apigateway";
import { NodejsFunction } from "@cdk-util/aws-lambda";

export class LambdaToolboxExampleStack extends DefaultEnvStack {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      description: `lambda-toolbox example`,
    });

    const handler = new NodejsFunction(this, "handler", {
      packageDirectory: "lambda",
    });

    const restApi = new LambdaRestApi(this, "restApi", {
      restApiName: `lambdatoolbox-example`,
      binaryMediaTypes: ["image/*", "audio/*", "video/*"],
      handler,
    });
  }
}
