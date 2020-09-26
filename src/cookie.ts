export function findCookie(cookies: string[], name: string) {
  const key = `${name}=`;
  const value = cookies.find(cookie => cookie.startsWith(key));

  return value?.substr(key.length);
}
