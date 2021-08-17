import { Construct } from "@aws-cdk/core";
import { DefaultEnvStack } from "@cdk-util/core";
import { LambdaRestApi } from "@aws-cdk/aws-apigateway";
import { NodejsFunction } from "@cdk-util/aws-lambda";
import { UserPool, UserPoolClient } from '@aws-cdk/aws-cognito';
import { CognitoUserPoolUser } from "@cdk-util/aws-cognito";
import {
  COGNITO_USER_ID,
  SSM_PARAM_COGNITO_USER_PASSWORD,
  SSM_PARAM_API_ENDPOINT,
  SSM_PARAM_COGNITO_USER_POOL_ID,
  SSM_PARAM_COGNITO_WEB_CLIENT_ID,
} from "./constants";

export class LambdaToolboxExampleStack extends DefaultEnvStack {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      description: `lambda-toolbox example`,
    });

    const userPool = new UserPool(this, 'userPool', {
      signInAliases: {
        username: true,
        email: true,
        phone: false,
        preferredUsername: true,
      },
      autoVerify: {
        email: true,
        phone: false,
      },
    });

    const webClient = new UserPoolClient(this, "webClient", {
      userPool,
      userPoolClientName: "WebClient",
      authFlows: {
        userSrp: true,
      },
    });

    new CognitoUserPoolUser(this, 'cognitoUser', {
      userPool,
      username: COGNITO_USER_ID,
      passwordStore: "ssm",
      passwordParameterName: SSM_PARAM_COGNITO_USER_PASSWORD,
      providerOnly: false,
    });

    const handler = new NodejsFunction(this, "handler", {
      packageDirectory: "lambda",
      environment: {
        USER_POOL_ID: userPool.userPoolId,
      },
    });

    const restApi = new LambdaRestApi(this, "restApi", {
      restApiName: `lambdatoolbox-example`,
      binaryMediaTypes: ["image/*", "audio/*", "video/*"],
      handler,
    });

    this.createStringParameters({
      apiEndpointParameter: {
        parameterName: SSM_PARAM_API_ENDPOINT,
        stringValue: restApi.url,
      },
      userPoolIdParameter: {
        parameterName: SSM_PARAM_COGNITO_USER_POOL_ID,
        stringValue: userPool.userPoolId,
      },
      webClientIdParameter: {
        parameterName: SSM_PARAM_COGNITO_WEB_CLIENT_ID,
        stringValue: webClient.userPoolClientId,
      },
    });
  }
}
