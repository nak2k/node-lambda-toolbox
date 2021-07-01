export interface ResultHeaders {
  [name: string]: boolean | number | string;
}

/**
 * Add specified headers to the result.
 * 
 * @param result 
 * @param headers 
 */
export function addHeaders(result: { headers?: ResultHeaders }, headers: ResultHeaders) {
  if (result.headers) {
    Object.assign(result.headers, headers);
  } else {
    result.headers = headers;
  }
}
