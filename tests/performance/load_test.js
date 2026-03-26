
---

### 144. `tests/performance/load_test.js`
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },  // ramp up to 20 users
    { duration: '3m', target: 50 },  // stay at 50 users
    { duration: '1m', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // error rate < 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8000';

export default function () {
  // Login
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(loginRes, { 'login successful': (r) => r.status === 200 });
  const token = loginRes.json('access_token');

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // List scans
  const scansRes = http.get(`${BASE_URL}/scans/`, { headers });
  check(scansRes, { 'scans listed': (r) => r.status === 200 });

  // List targets
  const targetsRes = http.get(`${BASE_URL}/targets/`, { headers });
  check(targetsRes, { 'targets listed': (r) => r.status === 200 });

  // List findings
  const findingsRes = http.get(`${BASE_URL}/findings/`, { headers });
  check(findingsRes, { 'findings listed': (r) => r.status === 200 });

  sleep(1);
}