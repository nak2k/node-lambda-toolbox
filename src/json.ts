import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

/**
 * Parse the body of the event as JSON.
 * 
 * If the body is base64-encoded, decode it too.
 * 
 * @param event 
 * @returns 
 */
export function getJsonBody<T = any>(event: {
  body?: string;
  isBase64Encoded?: boolean;
}): T | undefined {
  let { body } = event;

  if (!body) {
    return;
  }

  if (event.isBase64Encoded) {
    body = Buffer.from(body, 'base64').toString();
  }

  try {
    return JSON.parse(body);
  } catch (err) {
    return;
  }
}

/**
 * Generate the result that has body and headers for JSON.
 * 
 * @param body Any value that is converted to JSON string.
 * @param statusCode 
 * @returns 
 */
export function resultJson(body: any, statusCode: number = 200): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
