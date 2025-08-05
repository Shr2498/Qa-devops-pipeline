const request = require('supertest')
const app = require('../../src/app')

describe('Integration Tests - Full API Workflow', () => {
  let authToken
  let productId

  describe('User Registration and Authentication Flow', () => {
    it('should complete full user registration and login flow', async () => {
      // 1. Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'integrationtest',
          email: 'integration@example.com',
          password: 'Password123'
        })
        .expect(201)

      expect(registerResponse.body).toHaveProperty('userId')

      // 2. Login with the registered user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration@example.com',
          password: 'Password123'
        })
        .expect(200)

      expect(loginResponse.body).toHaveProperty('token')
      authToken = loginResponse.body.token

      // 3. Access protected endpoint with token
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(meResponse.body.user).toHaveProperty('email', 'integration@example.com')
    })
  })

  describe('Product Management Flow', () => {
    beforeAll(async () => {
      // Ensure we have authentication token
      if (!authToken) {
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'integration@example.com',
            password: 'Password123'
          })
        authToken = loginResponse.body.token
      }
    })

    it('should complete full product CRUD operations', async () => {
      // 1. Create a new product
      const createResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Integration Test Product',
          description: 'Product created during integration testing',
          price: 99.99,
          category: 'Testing',
          stock: 25
        })
        .expect(201)

      expect(createResponse.body).toHaveProperty('productId')
      ;({ productId } = createResponse.body)

      // 2. Retrieve the created product
      const getResponse = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200)

      expect(getResponse.body.product).toHaveProperty('name', 'Integration Test Product')
      expect(getResponse.body.product).toHaveProperty('price', 99.99)

      // 3. Update the product
      const updateResponse = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Integration Test Product',
          price: 89.99
        })
        .expect(200)

      expect(updateResponse.body).toHaveProperty('message', 'Product updated successfully')

      // 4. Verify the update
      const getUpdatedResponse = await request(app)
        .get(`/api/products/${productId}`)
        .expect(200)

      expect(getUpdatedResponse.body.product).toHaveProperty('name', 'Updated Integration Test Product')
      expect(getUpdatedResponse.body.product).toHaveProperty('price', 89.99)

      // 5. Delete the product
      const deleteResponse = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(deleteResponse.body).toHaveProperty('message', 'Product deleted successfully')

      // 6. Verify deletion
      await request(app)
        .get(`/api/products/${productId}`)
        .expect(404)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle cascading errors gracefully', async () => {
      // Try to create product with invalid data
      const invalidProductResponse = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Invalid
          price: -10, // Invalid
          category: 'Test'
          // Missing stock
        })
        .expect(400)

      expect(invalidProductResponse.body).toHaveProperty('error', 'Validation failed')

      // Try to access non-existent product
      await request(app)
        .get('/api/products/99999')
        .expect(404)

      // Try to update non-existent product
      await request(app)
        .put('/api/products/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' })
        .expect(404)

      // Try to delete non-existent product
      await request(app)
        .delete('/api/products/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })

  describe('Pagination and Filtering Integration', () => {
    beforeAll(async () => {
      // Create multiple test products for pagination testing
      const products = [
        { name: 'Product A', price: 10, category: 'Category1', stock: 5 },
        { name: 'Product B', price: 20, category: 'Category1', stock: 10 },
        { name: 'Product C', price: 30, category: 'Category2', stock: 15 }
      ]

      for (const product of products) {
        await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(product)
      }
    })

    it('should handle pagination correctly', async () => {
      // Test first page
      const page1Response = await request(app)
        .get('/api/products?page=1&limit=2')
        .expect(200)

      expect(page1Response.body.products).toHaveLength(2)
      expect(page1Response.body.pagination).toHaveProperty('page', 1)
      expect(page1Response.body.pagination).toHaveProperty('limit', 2)

      // Test second page
      const page2Response = await request(app)
        .get('/api/products?page=2&limit=2')
        .expect(200)

      expect(page2Response.body.pagination).toHaveProperty('page', 2)
    })

    it('should handle category filtering correctly', async () => {
      const categoryResponse = await request(app)
        .get('/api/products?category=Category1')
        .expect(200)

      expect(categoryResponse.body.products.length).toBeGreaterThan(0)
      categoryResponse.body.products.forEach(product => {
        expect(product.category).toBe('Category1')
      })
    })
  })
})
