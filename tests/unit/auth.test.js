const request = require('supertest')
const app = require('../../src/app')

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body).toHaveProperty('message', 'User created successfully')
      expect(response.body).toHaveProperty('userId')
      expect(typeof response.body.userId).toBe('number')
    })

    it('should reject registration with invalid email', async () => {
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Password123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
      expect(response.body.details).toContain('email')
    })

    it('should reject registration with weak password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'weak'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })

    it('should reject registration with duplicate email', async () => {
      const userData = {
        username: 'testuser2',
        email: 'test@example.com', // This email already exists in mock data
        password: 'Password123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409)

      expect(response.body).toHaveProperty('error', 'User already exists')
    })

    it('should reject registration with missing required fields', async () => {
      const userData = {
        username: 'testuser'
        // Missing email and password
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a test user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'logintest',
          email: 'logintest@example.com',
          password: 'Password123'
        })
    })

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'logintest@example.com',
        password: 'Password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Login successful')
      expect(response.body).toHaveProperty('token')
      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('email', 'logintest@example.com')
    })

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Invalid credentials')
    })

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'logintest@example.com',
        password: 'WrongPassword'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Invalid credentials')
    })

    it('should reject login with malformed email', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'Password123'
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })
  })

  describe('GET /api/auth/me', () => {
    let authToken

    beforeEach(async () => {
      // Register and login to get auth token
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'metest',
          email: 'metest@example.com',
          password: 'Password123'
        })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'metest@example.com',
          password: 'Password123'
        })

      authToken = loginResponse.body.token
    })

    it('should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body.user).toHaveProperty('email', 'metest@example.com')
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Access token required')
    })

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403)

      expect(response.body).toHaveProperty('error', 'Invalid token')
    })
  })
})
