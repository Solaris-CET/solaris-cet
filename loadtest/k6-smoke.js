import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 10,
  duration: '60s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
  },
}

const base = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '')

export default function () {
  const urls = [`${base}/api/status`, `${base}/api/health`]
  for (const url of urls) {
    const res = http.get(url, { headers: { 'cache-control': 'no-store' } })
    check(res, {
      'status is 200': (r) => r.status === 200,
    })
  }
  sleep(1)
}

