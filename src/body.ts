import { APIGatewayProxyEventV2 } from "aws-lambda";

export function parseBodyAsText(event: APIGatewayProxyEventV2) {
  return event.body
    ? (event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString()
      : event.body)
    : '';
}
