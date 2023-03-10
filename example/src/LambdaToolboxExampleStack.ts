import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { CognitoUserPoolUser, DefaultEnvStack } from "aws-cdk-util";
import { Construct } from "constructs";
import {
  COGNITO_USER_ID, SSM_PARAM_API_ENDPOINT, SSM_PARAM_COGNITO_USER_PASSWORD, SSM_PARAM_COGNITO_USER_POOL_ID,
  SSM_PARAM_COGNITO_WEB_CLIENT_ID
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
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        SLACK_CHANNEL: process.env.SLACK_CHANNEL || "",
        SLACK_INCOMING_WEBHOOK_URL: process.env.SLACK_INCOMING_WEBHOOK_URL || "",
      },
    });

    const restApi = new LambdaRestApi(this, "restApi", {
      restApiName: `lambdatoolbox-example`,
      binaryMediaTypes: ["image/*", "audio/*", "video/*"],
      handler,
      cloudWatchRole: false,
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
