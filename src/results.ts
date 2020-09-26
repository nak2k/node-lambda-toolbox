import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { STATUS_CODES } from 'http';

export function result301(location: string): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 301,
    headers: {
      location,
    },
  };
}

export function result302(location: string): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 302,
    headers: {
      location,
    },
  };
}

export function result303(location: string): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 303,
    headers: {
      location,
    },
  };
}

function resultOf(statusCode: number): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      'content-type': 'text/plain',
    },
    body: STATUS_CODES[statusCode],
  };
}

export const result400: APIGatewayProxyStructuredResultV2 = resultOf(400);
export const result404: APIGatewayProxyStructuredResultV2 = resultOf(404);
export const result405: APIGatewayProxyStructuredResultV2 = resultOf(405);

export const resultMovedPermanently = result301;
export const resultFound = result302;
export const resultSeeOther = result303;
export const resultBadRequest = result400;
export const resultNotFound = result404;
export const resultMethodNotAllowed = result405;
