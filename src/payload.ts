import type {
  APIGatewayEventClientCertificate,
  APIGatewayEventIdentity,
  APIGatewayProxyEvent,
  APIGatewayProxyEventHeaders,
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayTokenAuthorizerEvent,
  DynamoDBStreamEvent,
} from 'aws-lambda';
import { parse } from 'cookie';

export function isDynamoDBStreamEvent(event: any): event is DynamoDBStreamEvent {
  return event?.Records?.[0]?.eventSource === "aws:dynamodb";
}

export function isPayloadV1(event: any): event is APIGatewayProxyEvent {
  return event.version === undefined || event.version === '1.0';
}

export function isPayloadV2(event: any): event is APIGatewayProxyEventV2 {
  return event.version === '2.0';
}

export function isTokenAuthorizerPayload(event: any): event is APIGatewayTokenAuthorizerEvent {
  return event.type === "TOKEN" && event.methodArn;
}

export function toEventV2(event: any): APIGatewayProxyEventV2 {
  if (isPayloadV2(event)) {
    return event;
  }

  if (!isPayloadV1(event)) {
    throw new Error('The event is not APIGatewatProxyEvent');
  }

  const {
    path,
    httpMethod,
    multiValueHeaders,
    multiValueQueryStringParameters,
    requestContext,
    pathParameters,
    stageVariables,
    body,
    isBase64Encoded,
  } = event;

  const rawQueryString = Object.entries(multiValueQueryStringParameters || []).flatMap(([name, values]) => {
    if (!values) {
      return `${name}=`;
    }

    return values.map(value => {
      return `${name}=${encodeURIComponent(value)}`;
    });
  }).join('&');

  const queryStringParameters = Object.fromEntries(Object.entries(multiValueQueryStringParameters || []).map(([name, values]) => {
    if (!values) {
      return [name];
    }

    return [name, values.join(',')];
  }));

  const headers = Object.entries(multiValueHeaders || []).reduce((result, [name, values]) => {
    name = name.toLowerCase();

    if (!values) {
      result[name] = undefined;
      return result;
    }

    if (result[name]) {
      result[name] += ',' + values.join(',');
    } else {
      result[name] = values.join(',');
    }

    return result;
  }, {} as APIGatewayProxyEventHeaders);

  const cookies = Object.entries(multiValueHeaders || []).flatMap(([name, values]) => {
    if (name.toLowerCase() !== 'cookie') {
      return [];
    }

    if (!values) {
      return [`${name}=`];
    }

    return values.flatMap(value => {
      const cookies = parse(value);
      return Object.entries(cookies).map(([name, value]) => `${name}=${value}`);
    });
  });

  return {
    version: '2.0',
    routeKey: requestContext.routeKey || '',
    rawPath: requestContext.path,
    rawQueryString,
    cookies,
    headers,
    queryStringParameters,
    requestContext: {
      accountId: requestContext.accountId,
      apiId: requestContext.apiId,
      authentication: toEventV2Authentication(requestContext.identity),
      authorizer: toEventV2Authorizer(requestContext.authorizer),
      domainName: requestContext.domainName || '',
      domainPrefix: requestContext.domainPrefix || '',
      http: {
        method: httpMethod,
        path,
        protocol: requestContext.protocol,
        sourceIp: requestContext.identity.sourceIp,
        userAgent: requestContext.identity.userAgent || '',
      },
      requestId: requestContext.requestId,
      routeKey: requestContext.routeKey || '',
      stage: requestContext.stage,
      time: requestContext.requestTime || '',
      timeEpoch: requestContext.requestTimeEpoch,
    },
    body: nullToUndefined(body),
    pathParameters: nullToUndefined(pathParameters),
    isBase64Encoded,
    stageVariables: nullToUndefined(stageVariables),
  } as APIGatewayProxyEventV2WithJWTAuthorizer;
}

function toEventV2Authentication(identity: APIGatewayEventIdentity): {
  clientCert: APIGatewayEventClientCertificate;
} | undefined {
  const clientCert = identity?.clientCert;
  if (!clientCert) {
    return undefined;
  }

  return { clientCert };
}

function toEventV2Authorizer(authorizer: any) {
  if (!authorizer || !authorizer.claims) {
    return undefined;
  }

  return {
    jwt: {
      claims: authorizer.claims,
      scopes: authorizer.scopes,
    },
  };
}

function nullToUndefined<T>(v: T | null): T | undefined {
  return v === null ? undefined : v;
}
