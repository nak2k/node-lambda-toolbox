import type { ResultHeaders } from './util';

export function addHeaders(result: { headers?: ResultHeaders }, headers: ResultHeaders) {
  if (result.headers) {
    Object.assign(result.headers, headers);
  } else {
    result.headers = headers;
  }
}
