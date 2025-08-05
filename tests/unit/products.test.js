const request = require('supertest')
const app = require('../../src/app')

describe('Product Routes', () => {
  let authToken

  beforeEach(async () => {
    // Register and login to get auth token for protected routes
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'producttest',
        email: 'producttest@example.com',
        password: 'Password123'
      })

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'producttest@example.com',
        password: 'Password123'
      })

    authToken = loginResponse.body.token
  })

  describe('GET /api/products', () => {
    it('should return list of products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200)

      expect(response.body).toHaveProperty('products')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.products)).toBe(true)
      expect(response.body.products.length).toBeGreaterThan(0)
    })

    it('should return paginated products', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=1')
        .expect(200)

      expect(response.body.pagination).toHaveProperty('page', 1)
      expect(response.body.pagination).toHaveProperty('limit', 1)
      expect(response.body.products.length).toBeLessThanOrEqual(1)
    })

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products?category=Electronics')
        .expect(200)

      expect(response.body.products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'Electronics'
          })
        ])
      )
    })
  })

  describe('GET /api/products/:id', () => {
    it('should return a specific product', async () => {
      const response = await request(app)
        .get('/api/products/1')
        .expect(200)

      expect(response.body).toHaveProperty('product')
      expect(response.body.product).toHaveProperty('id', 1)
      expect(response.body.product).toHaveProperty('name')
      expect(response.body.product).toHaveProperty('price')
    })

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/9999')
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Product not found')
    })

    it('should return 400 for invalid product ID', async () => {
      const response = await request(app)
        .get('/api/products/invalid')
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Invalid product ID')
    })
  })

  describe('POST /api/products', () => {
    it('should create a new product with valid data', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        price: 25.99,
        category: 'Test',
        stock: 10
      }

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201)

      expect(response.body).toHaveProperty('message', 'Product created successfully')
      expect(response.body).toHaveProperty('productId')
    })

    it('should reject product creation without authentication', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product',
        price: 25.99,
        category: 'Test',
        stock: 10
      }

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Access token required')
    })

    it('should reject product with invalid data', async () => {
      const productData = {
        name: '', // Invalid: empty name
        price: -10, // Invalid: negative price
        category: 'Test',
        stock: 10
      }

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })

    it('should reject product with missing required fields', async () => {
      const productData = {
        name: 'Test Product'
        // Missing price, category, stock
      }

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(400)

      expect(response.body).toHaveProperty('error', 'Validation failed')
    })
  })

  describe('PUT /api/products/:id', () => {
    it('should update an existing product', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 35.99
      }

      const response = await request(app)
        .put('/api/products/1')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Product updated successfully')
    })

    it('should reject update without authentication', async () => {
      const updateData = {
        name: 'Updated Product'
      }

      const response = await request(app)
        .put('/api/products/1')
        .send(updateData)
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Access token required')
    })

    it('should return 404 for non-existent product update', async () => {
      const updateData = {
        name: 'Updated Product'
      }

      const response = await request(app)
        .put('/api/products/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Product not found')
    })
  })

  describe('DELETE /api/products/:id', () => {
    it('should delete an existing product', async () => {
      const response = await request(app)
        .delete('/api/products/2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('message', 'Product deleted successfully')
    })

    it('should reject delete without authentication', async () => {
      const response = await request(app)
        .delete('/api/products/1')
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Access token required')
    })

    it('should return 404 for non-existent product deletion', async () => {
      const response = await request(app)
        .delete('/api/products/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body).toHaveProperty('error', 'Product not found')
    })
  })
})
