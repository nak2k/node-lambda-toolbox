import { contentType } from 'mime-types';
import {
  extname,
  join,
  resolve,
  relative,
} from 'path';
import { promises } from 'fs';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { matchMediaType } from './util';

const { readFile } = promises;

export interface ServeStaticOptions {
  /**
   * The path on the file system of the root directory where static files are stored.
   */
  root: string;

  /**
   * The base path that serves static files.
   *
   * Default: '/'
   */
  basePath?: string;

  /**
   * Media types that assume files as text.
   *
   * Defaul:t: ['text/*', 'application/json']
   */
  textMediaTypes?: string[];
}

export async function serveStatic(event: APIGatewayProxyEventV2, options: ServeStaticOptions): Promise<APIGatewayProxyStructuredResultV2 | undefined> {
  const {
    root,
    basePath = '/',
    textMediaTypes = ['text/*', 'application/json'],
  } = options;

  const path = resolve('/', event.rawPath);

  if (!path.startsWith(basePath)) {
    return;
  }

  const httpMethod = event.requestContext.http.method;

  if (httpMethod !== 'GET' && httpMethod !== 'HEAD') {
    return;
  }

  const relpath = relative(basePath, path);
  const file = join(root, relpath);

  const data = await readFile(file).catch(err => {
    if (err.code === 'ENOENT' || err.code === 'EISDIR') {
      return;
    } else {
      throw err;
    }
  });

  if (!data) {
    return;
  }

  const type = contentType(extname(path)) || 'application/octet-stream';

  if (matchMediaType(type, textMediaTypes)) {
    return {
      statusCode: 200,
      headers: {
        'content-type': type,
      },
      body: data.toString(),
    };
  } else {
    return {
      statusCode: 200,
      headers: {
        'content-type': type,
      },
      body: data.toString('base64'),
      isBase64Encoded: true,
    };
  }
}
