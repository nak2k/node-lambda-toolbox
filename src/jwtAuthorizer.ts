import jwt = require('jsonwebtoken');
import jwksRsa = require('jwks-rsa');
import { findCookie } from './cookie';
import { EventHeaders } from './util';
import { isPayloadV2 } from './payload';

export interface AuthorizedResult<T> {
  accessToken: string;
  decodedAccessToken: T;
}

interface AuthorizerEvent {
  headers: EventHeaders;
  cookies?: string[];
}

export type Authorizer<T> = (event: AuthorizerEvent) => Promise<AuthorizedResult<T> | undefined>;

export interface CognitoAuthorizerOptions {
  cookieName?: string;
  region?: string;
  userPoolId?: string;
}

export interface JwtAuthorizerOptions {
  jwksUri: string;
  cookieName?: string;
}

export function cognitoAuthorizer<T>(options: CognitoAuthorizerOptions = {}): Authorizer<T> {
  const {
    cookieName,
    region = process.env.AWS_REGION,
    userPoolId = process.env.USER_POOL_ID,
  } = options;

  if (!userPoolId) {
    throw new Error('options.userPoolId must be specified');
  }

  const jwksUri = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

  return jwtAuthorizer({
    jwksUri,
    cookieName,
  });
};

export function jwtAuthorizer<T>(options: JwtAuthorizerOptions): Authorizer<T> {
  const {
    jwksUri,
    cookieName,
  } = options;

  const client = jwksRsa({
    jwksUri,
  });

  function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    client.getSigningKey(header.kid!, (err, key) => {
      if (err) {
        return callback(err);
      }

      callback(null, (key as jwksRsa.CertSigningKey).publicKey || (key as jwksRsa.RsaSigningKey).rsaPublicKey);
    });
  }

  return (event: AuthorizerEvent) => {
    /*
     * Get an access token.
     */
    let accessToken: string | undefined;

    const { authorization } = event.headers;
    if (authorization) {
      const ss = authorization.split(' ');
      if (ss[0] === 'Bearer') {
        accessToken = ss[1];
      }
    }

    if (!accessToken && cookieName) {
      const { cookies } = event;

      if (!cookies) {
        return isPayloadV2(event)
          ? Promise.resolve(undefined)
          : Promise.reject(new Error('Support payload version 2 only'));
      }

      accessToken = findCookie(cookies, cookieName);
    }

    return new Promise((resolve, reject) => {
      if (!accessToken) {
        return resolve(undefined);
      }

      /*
       * Verify the access token.
       */
      jwt.verify(accessToken, getKey, {}, (err, decoded) => {
        if (err) {
          console.error(err);
          return resolve(undefined);
        }

        resolve({
          accessToken: accessToken!,
          decodedAccessToken: decoded as any,
        });
      });
    });
  };
}
