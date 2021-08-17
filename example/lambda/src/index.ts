import { APIGatewayProxyEvent } from "aws-lambda";
import {
  isPayloadV2,
  toEventV2,
  defineRouter,
  cognitoAuthorizer,
  resultNotFound,
  resultBadRequest,
} from "lambda-toolbox";

const router = defineRouter()
  .post("/prod/authorizer", async (event, context) => {
    const authorizedResult = await cognitoAuthorizer()(event);

    if (authorizedResult === undefined) {
      return resultBadRequest;
    }

    return {
      statusCode: 200,
      body: JSON.stringify(authorizedResult.decodedAccessToken),
    };
  })
  .build();

export async function handler(event: APIGatewayProxyEvent, context: any) {
  console.log('Event: %j', event);

  const eventV2 = isPayloadV2(event) ? event : toEventV2(event);

  console.log('EventV2: %j', eventV2);

  const result = await router(eventV2, context);

  console.log('Result: %j', result);

  return result ?? resultNotFound;
}
