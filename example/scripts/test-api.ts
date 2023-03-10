#!/usr/bin/env ts-node
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
} from "amazon-cognito-identity-js";
import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";
import {
  COGNITO_USER_ID,
  SSM_PARAM_API_ENDPOINT,
  SSM_PARAM_COGNITO_USER_POOL_ID,
  SSM_PARAM_COGNITO_USER_PASSWORD,
  SSM_PARAM_COGNITO_WEB_CLIENT_ID,
} from "../src/constants";
import fetch from "node-fetch";

async function getParameters() {
  const ssm = new SSMClient({});

  const { Parameters } = await ssm.send(new GetParametersCommand({
    Names: [
      SSM_PARAM_API_ENDPOINT,
      SSM_PARAM_COGNITO_USER_POOL_ID,
      SSM_PARAM_COGNITO_USER_PASSWORD,
      SSM_PARAM_COGNITO_WEB_CLIENT_ID,
    ],
  }));

  if (!Parameters) {
    throw new Error("SSM Parameters not found");
  }

  const result: { [name: string]: string } = {};

  Parameters.forEach((p) => {
    result[p.Name!] = p.Value!;
  });

  return result;
}

async function authenticate(options: {
  UserPoolId: string;
  ClientId: string;
  Username: string;
  Password: string;
}) {
  const cognitoUserPool = new CognitoUserPool(options);

  const cognitoUser = new CognitoUser({
    Pool: cognitoUserPool,
    Username: options.Username,
  });

  const authenticationDetails = new AuthenticationDetails(options);

  return new Promise<string>((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess(session: CognitoUserSession) {
        const idToken = session.getIdToken();
        resolve(idToken.getJwtToken());
      },
      onFailure: reject,
    });
  });
}

async function requestTestApi(options: { url: string; idToken: string }) {
  const headers = {
    authorization: "Bearer " + options.idToken,
    "content-type": "application/json",
  };

  console.log("Request: ", options.url);
  console.log("Headers: %s", JSON.stringify(headers, null, 2));
  console.log();

  const res = await fetch(options.url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "test",
    }),
  });

  console.log(`Response: ${res.status} ${res.statusText}`);
  console.log("Body:");
  console.log(JSON.stringify(await res.json(), null, 2));
}

async function main() {
  const parameters = await getParameters();

  const accessToken = await authenticate({
    UserPoolId: parameters[SSM_PARAM_COGNITO_USER_POOL_ID],
    ClientId: parameters[SSM_PARAM_COGNITO_WEB_CLIENT_ID],
    Username: COGNITO_USER_ID,
    Password: parameters[SSM_PARAM_COGNITO_USER_PASSWORD],
  });

  const apiEndpoint = parameters[SSM_PARAM_API_ENDPOINT];

  await requestTestApi({
    url: apiEndpoint + 'authorizer',
    idToken: accessToken,
  });
}

main().catch((err) => {
  console.error(err);
});
