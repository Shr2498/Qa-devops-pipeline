import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')

// Performance test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 }, // Stay at 10 users for 5 minutes
    { duration: '2m', target: 20 }, // Ramp up to 20 users over 2 minutes
    { duration: '5m', target: 20 }, // Stay at 20 users for 5 minutes
    { duration: '2m', target: 0 } // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'], // Error rate should be less than 10%
    errors: ['rate<0.1'] // Custom error rate should be less than 10%
  }
}

const BASE_URL = 'http://localhost:3000'

export function setup () {
  // Register a test user for authentication tests
  const registerResponse = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    username: 'loadtest',
    email: 'loadtest@example.com',
    password: 'Password123'
  }), {
    headers: { 'Content-Type': 'application/json' }
  })

  if (registerResponse.status === 201 || registerResponse.status === 409) {
    // Login to get auth token
    const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: 'loadtest@example.com',
      password: 'Password123'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

    if (loginResponse.status === 200) {
      const token = loginResponse.json('token')
      return { authToken: token }
    }
  }

  return { authToken: null }
}

export default function (data) {
  // Test 1: Health check endpoint
  const healthResponse = http.get(`${BASE_URL}/health`)
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 200ms': (r) => r.timings.duration < 200
  }) || errorRate.add(1)

  sleep(1)

  // Test 2: Get products (public endpoint)
  const productsResponse = http.get(`${BASE_URL}/api/products`)
  check(productsResponse, {
    'products status is 200': (r) => r.status === 200,
    'products response time < 500ms': (r) => r.timings.duration < 500,
    'products response has data': (r) => r.json('products').length > 0
  }) || errorRate.add(1)

  sleep(1)

  // Test 3: Get specific product
  const productResponse = http.get(`${BASE_URL}/api/products/1`)
  check(productResponse, {
    'single product status is 200': (r) => r.status === 200,
    'single product response time < 300ms': (r) => r.timings.duration < 300
  }) || errorRate.add(1)

  sleep(1)

  // Test 4: Authentication flow (if auth token is available)
  if (data.authToken) {
    const authHeaders = {
      Authorization: `Bearer ${data.authToken}`,
      'Content-Type': 'application/json'
    }

    // Test authenticated endpoint
    const meResponse = http.get(`${BASE_URL}/api/auth/me`, {
      headers: authHeaders
    })
    check(meResponse, {
      'auth me status is 200': (r) => r.status === 200,
      'auth me response time < 300ms': (r) => r.timings.duration < 300
    }) || errorRate.add(1)

    sleep(1)

    // Test creating a product
    const createProductResponse = http.post(`${BASE_URL}/api/products`, JSON.stringify({
      name: `Load Test Product ${Math.random()}`,
      description: 'Product created during load testing',
      price: Math.floor(Math.random() * 100) + 1,
      category: 'LoadTest',
      stock: Math.floor(Math.random() * 50) + 1
    }), {
      headers: authHeaders
    })
    check(createProductResponse, {
      'create product status is 201': (r) => r.status === 201,
      'create product response time < 800ms': (r) => r.timings.duration < 800
    }) || errorRate.add(1)
  }

  sleep(1)

  // Test 5: Error handling - try to access non-existent endpoint
  const notFoundResponse = http.get(`${BASE_URL}/api/nonexistent`)
  check(notFoundResponse, {
    'not found status is 404': (r) => r.status === 404,
    'not found response time < 200ms': (r) => r.timings.duration < 200
  }) || errorRate.add(1)

  sleep(1)
}

export function teardown (data) {
  // Clean up any resources if needed
  // eslint-disable-next-line no-console
  console.log('Load test completed')
  if (data.authToken) {
    // eslint-disable-next-line no-console
    console.log('Authentication token was used during testing')
  }
}
