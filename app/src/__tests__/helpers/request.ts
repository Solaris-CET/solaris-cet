export function testRequest(path: string, init: RequestInit = {}, token?: string): Request {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('origin', 'https://allowed.test');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return new Request(`http://test${path}`, { ...init, headers });
}

export function adminRequest(path: string, init?: RequestInit): Request {
  return testRequest(path, init, 'admin-token');
}

export function authRequest(path: string, init?: RequestInit): Request {
  return testRequest(path, init, 'valid-token');
}
