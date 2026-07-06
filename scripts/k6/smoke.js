import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 20),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:4173';

export default function () {
  const home = http.get(`${BASE_URL}/`);
  check(home, { 'home 200': (r) => r.status === 200 });

  const health = http.get(`${BASE_URL}/health.json`);
  check(health, { 'health 200': (r) => r.status === 200 });

  if (__ENV.AI_CHAT === '1') {
    const chat = http.post(
      `${BASE_URL}/api/chat`,
      JSON.stringify({ query: 'Ping', conversation: [] }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    check(chat, { 'chat 200/429/503': (r) => [200, 429, 503].includes(r.status) });
  }

  sleep(1);
}

