import { URL } from 'url';
import { join, relative } from 'path';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { GetObjectOutput } from 'aws-sdk/clients/s3';
import { matchMediaType } from './util';
import { parse } from 'content-type';
import { serveStatic } from './serveStatic';

const LOCAL = process.env.AWS_SAM_LOCAL === 'true';

interface S3FetchOptions {
  /**
   * The name of the S3 bucket to be rendered.
   */
  bucket?: string;

  /**
   * The key to be the base point on the S3 bucket to be rendered.
   * 
   * @default ''
   */
  key?: string;

  /**
   * The base path that serves static files.
   * 
   * @default '/'
   */
  basePath?: string;

  /**
   * Media types that assume files as text.
   * 
   * @default ['text/*', 'application/json', 'application/javascript']
   */
  textMediaTypes?: string[];

  /**
   * The path on the file system of the root directory where static files are stored.
   */
  root?: string;
}

export function parseS3Uri(s3Uri: string) {
  const url = new URL(s3Uri);

  if (url.protocol !== 's3:') {
    throw new Error('s3Uri must start with "s3:"');
  }

  return {
    bucket: url.hostname,
    key: url.pathname.substr(1),
  };
}

export async function s3Fetch(event: APIGatewayProxyEventV2, options: S3FetchOptions): Promise<APIGatewayProxyStructuredResultV2 | undefined> {
  const {
    bucket,
    key = '',
    basePath = '/',
    textMediaTypes = ['text/*', 'application/json', 'application/javascript'],
    root,
  } = options;

  if (LOCAL && root) {
    return serveStatic(event, {
      root,
      basePath,
      textMediaTypes,
    });
  }

  if (!bucket) {
    throw new Error('options.bucket is required');
  }

  const httpMethod = event.requestContext.http.method;

  if (httpMethod !== 'GET' && httpMethod !== 'HEAD') {
    return;
  }

  let path = event.rawPath;

  if (!path.startsWith(basePath)) {
    return;
  }

  const s3 = new S3();

  const params = {
    Bucket: bucket,
    Key: join(key, relative(basePath, path)),
    IfNoneMatch: event.headers['if-none-match'],
  };

  let data: GetObjectOutput;

  try {
    data = await s3.getObject(params).promise();
  } catch (err: any) {
    if (err.statusCode === 304) {
      /*
       * Make for the client to use cache.
       */
      return {
        statusCode: 304,
        headers: {},
      };
    }

    if (err.code === 'NoSuchKey') {
      return;
    }

    throw err;
  };

  const { ContentType } = data;
  let isText: boolean;

  if (ContentType) {
    const { type } = parse(ContentType);
    isText = matchMediaType(type, textMediaTypes);
  } else {
    isText = false;
  }

  return {
    statusCode: 200,
    headers: {
      'cache-control': data.CacheControl!,
      'content-length': data.ContentLength!,
      'content-type': ContentType!,
      'etag': data.ETag!,
    },
    body: isText ? data.Body?.toString() : data.Body?.toString('base64'),
    isBase64Encoded: !isText,
  };
}
