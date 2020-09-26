import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

export function getJsonBody<T = any>(event: { body?: string }): T | undefined {
  const { body } = event;

  if (!body) {
    return;
  }

  try {
    return JSON.parse(body);
  } catch (err) {
    return;
  }
}

export function resultJson(body: any, statusCode: number = 200): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
