import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ───────────────────────────────────────────────────────────
const errorRate    = new Rate('error_rate');
const createTrend  = new Trend('post_users_duration');

// ─── Test Configuration ───────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '10s', target: 10 },  // ramp up to 10 virtual users
    { duration: '30s', target: 10 },  // hold at 10 virtual users
    { duration: '10s', target: 0  },  // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests must finish under 500ms
    error_rate:        ['rate<0.05'],  // error rate must stay below 5%
  },
};

const BASE_URL = 'http://localhost:4000';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// generates a unique email per virtual user + iteration to avoid duplicate conflicts
function randomEmail() {
  return `user_${__VU}_${__ITER}_${Date.now()}@test.com`;
}

// ─── Main Test Function ───────────────────────────────────────────────────────
export default function () {

  const payload = JSON.stringify({
    name:  `Test User ${__VU}`,
    email: randomEmail(),
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  // ── Happy Path: valid user creation ─────────────────────────────────────────
  const res = http.post(`${BASE_URL}/users`, payload, params);

  createTrend.add(res.timings.duration);

  const success = check(res, {
    'status is 201':              (r) => r.status === 201,
    'response has data.id':       (r) => r.json('data.id') !== undefined,
    'response has data.email':    (r) => r.json('data.email') !== undefined,
    'response time under 500ms':  (r) => r.timings.duration < 500,
  });

  errorRate.add(!success);

  sleep(1);
}


/**
 * execution result 
 * TOTAL RESULTS 

    checks_total.......: 1500   29.769349/s
    checks_succeeded...: 99.66% 1495 out of 1500
    checks_failed......: 0.33%  5 out of 1500

    ✓ status is 201
    ✓ response has data.id
    ✓ response has data.email
    ✗ response time under 500ms
      ↳  98% — ✓ 370 / ✗ 5

    CUSTOM
    error_rate.....................: 1.33%  5 out of 375
    post_users_duration............: avg=90.702669 min=32.8977 med=64.9866 max=1098.6917 p(90)=146.757  p(95)=192.75564

    HTTP
    http_req_duration..............: avg=90.7ms    min=32.89ms med=64.98ms max=1.09s     p(90)=146.75ms p(95)=192.75ms 
      { expected_response:true }...: avg=90.7ms    min=32.89ms med=64.98ms max=1.09s     p(90)=146.75ms p(95)=192.75ms 
    http_req_failed................: 0.00%  0 out of 375
    http_reqs......................: 375    7.442337/s

    EXECUTION
    iteration_duration.............: avg=1.09s     min=1.03s   med=1.06s   max=2.1s      p(90)=1.14s    p(95)=1.19s    
    iterations.....................: 375    7.442337/s
    vus............................: 1      min=1        max=10
    vus_max........................: 10     min=10       max=10

    NETWORK
    data_received..................: 171 kB 3.4 kB/s
    data_sent......................: 72 kB  1.4 kB/s




running (0m50.4s), 00/10 VUs, 375 complete and 0 interrupted iterations
default ✓ [======================================] 00/10 VUs  50s
 */