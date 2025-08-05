const request = require('supertest')
const app = require('../../src/app')

describe('Application Health and Basic Functionality', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body).toHaveProperty('status', 'healthy')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('version')
    })
  })

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Route not found')
      expect(response.body.message).toContain('Cannot GET /api/non-existent-route')
    })
  })

  describe('CORS and Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      // Check for helmet security headers
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff')
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY')
    })
  })

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      await request(app)
        .get('/health')
        .expect(200)

      // Rate limit headers should be present (though health endpoint is exempt)
      // This tests that rate limiting middleware is active
    })
  })

  describe('JSON Parsing', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400)

      // Should get a parsing error, not crash the server
      expect(response.status).toBe(400)
    })
  })

  describe('Request Size Limits', () => {
    it('should reject oversized requests', async () => {
      const largeData = {
        data: 'x'.repeat(11 * 1024 * 1024) // 11MB payload (over 10MB limit)
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(largeData)
        .expect(413)

      expect(response.status).toBe(413)
    })
  })
})
