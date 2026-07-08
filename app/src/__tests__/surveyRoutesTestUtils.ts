import { expect } from 'vitest';

export const SURVEY_TEST_ORIGIN = 'https://x.test';

export async function jsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  return text ? (JSON.parse(text) as unknown) : null;
}

export function surveyRequest(path: string, init: RequestInit = {}): Request {
  const headers = new Headers(init.headers);
  if (!headers.has('origin')) {
    headers.set('origin', SURVEY_TEST_ORIGIN);
  }
  return new Request(`http://test${path}`, { ...init, headers });
}

export async function expectJsonStatus(res: Response, status: number): Promise<unknown> {
  expect(res.status).toBe(status);
  return jsonBody(res);
}

export function hasCorsAllowOrigin(res: Response): boolean {
  return Boolean(res.headers.get('Access-Control-Allow-Origin'));
}