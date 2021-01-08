export interface ResultHeaders {
  [name: string]: boolean | number | string;
}

export function addHeaders(result: { headers?: ResultHeaders }, headers: ResultHeaders) {
  if (result.headers) {
    Object.assign(result.headers, headers);
  } else {
    result.headers = headers;
  }
}
