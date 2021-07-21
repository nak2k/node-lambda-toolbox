import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { } from "lambda-toolbox";

export async function handler(event: APIGatewayProxyEvent, context: any): Promise<APIGatewayProxyResult> {
  console.log('Event: %j', event);

  return {
    statusCode: 200,
    headers: {
      'content-type': 'text/plain',
    },
    body: 'hello',
  };
}
