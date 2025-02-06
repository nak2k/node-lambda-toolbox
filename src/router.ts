import {
  pathToRegexp,
  Key,
} from 'path-to-regexp';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from 'aws-lambda';
import { resultBadRequest } from './results';

type HttpMethod = 'HEAD' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | '*';

type Lambda<Event, Result> = (event: Event, context: Context) => Promise<Result | undefined>;

interface Route<Event, Result> {
  keys: Key[];
  method: HttpMethod;
  path: string;
  lambda: Lambda<Event, Result>;
  re: RegExp;
}

interface RouterBaseEvent {
  rawPath: string;
  pathParameters?: { [name: string]: string | undefined };
  requestContext: {
    http: {
      method: string;
    };
  };
}

export function defineRouter<Event extends RouterBaseEvent = APIGatewayProxyEventV2, Result = APIGatewayProxyStructuredResultV2>() {
  return new Router<Event, Result>();
}

class Router<Event extends RouterBaseEvent, Result> {
  readonly _routes: Route<Event, Result>[];

  constructor() {
    this._routes = [];
  }

  _addRoute(method: HttpMethod, path: string | string[], lambda: Lambda<Event, Result>) {
    if (Array.isArray(path)) {
      path.forEach(path => this._addRoute(method, path, lambda));
      return;
    }

    let re: ReturnType<typeof pathToRegexp>;

    try {
      re = pathToRegexp(path);
    } catch (err: any) {
      throw new Error(`Failed to add route for ${method} ${path} (Cause: ${err.message})`);
    }

    this._routes.push({
      keys: re.keys,
      method,
      path,
      lambda,
      re: re.regexp,
    });
  }

  head(path: string | string[], lambda: Lambda<Event, Result>) {
    this._addRoute('HEAD', path, lambda);
    return this;
  }

  get(path: string | string[], lambda: Lambda<Event, Result>) {
    this._addRoute('GET', path, lambda);
    return this;
  }

  post(path: string | string[], lambda: Lambda<Event, Result>) {
    this._addRoute('POST', path, lambda);
    return this;
  }

  put(path: string | string[], lambda: Lambda<Event, Result>) {
    this._addRoute('PUT', path, lambda);
    return this;
  }

  delete(path: string | string[], lambda: Lambda<Event, Result>) {
    this._addRoute('DELETE', path, lambda);
    return this;
  }

  patch(path: string | string[], lambda: Lambda<Event, Result>) {
    this._addRoute('PATCH', path, lambda);
    return this;
  }

  options(path: string | string[], lambda: Lambda<Event, Result>) {
    this._addRoute('OPTIONS', path, lambda);
    return this;
  }

  all(path: string | string[], lambda: Lambda<Event, Result>) {
    this._addRoute('*', path, lambda);
    return this;
  }

  build() {
    return this._routes.map(routeToPambda).reduceRight(
      (next, pambda) => pambda(next),
      (event: Event, context: Context): Promise<Result | undefined> => Promise.resolve(undefined)
    );
  }
}

function routeToPambda<Event extends RouterBaseEvent, Result>(route: Route<Event, Result>) {
  return (next: Lambda<Event, Result>): Lambda<Event, Result> => {
    return (event, context) => {
      if (route.method !== '*' && route.method !== event.requestContext.http.method) {
        return next(event, context);
      }

      const match = route.re.exec(event.rawPath);
      if (!match) {
        return next(event, context);
      }

      if (!event.pathParameters) {
        event.pathParameters = {};
      }

      const params = event.pathParameters;
      const { keys } = route;

      for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const value = match[i + 1];

        try {
          params[key.name] = decodeURIComponent(value);
        } catch (err) {
          return Promise.resolve(resultBadRequest as unknown as Result);
        }
      }

      return route.lambda(event, context);
    };
  };
}


