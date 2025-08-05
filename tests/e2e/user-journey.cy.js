describe('User Journey E2E Tests', () => {
  let authToken
  const timestamp = Date.now()
  const testUser = {
    username: `e2etest${timestamp}`,
    email: `e2etest${timestamp}@example.com`,
    password: 'Password123'
  }

  it('should complete full user registration and authentication flow', () => {
    // Register a new user
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: testUser
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('message', 'User created successfully')
      expect(response.body).to.have.property('userId')
      
      // Login with the registered user
      return cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: testUser.email,
          password: testUser.password
        }
      })
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('token')
      expect(response.body).to.have.property('user')
      authToken = response.body.token
      
      // Access protected endpoint
      return cy.request({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.user).to.have.property('email', testUser.email)
    })
  })

  it('should handle product management workflow', () => {
    let productId

    // First login to get auth token
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        email: 'e2etest@example.com',
        password: 'Password123'
      }
    }).then((response) => {
      authToken = response.body.token

      // Create a product
      cy.request({
        method: 'POST',
        url: '/api/products',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: {
          name: 'E2E Test Product',
          description: 'Product created during E2E testing',
          price: 49.99,
          category: 'E2E Testing',
          stock: 20
        }
      }).then((createResponse) => {
        expect(createResponse.status).to.eq(201)
        ;({ productId } = createResponse.body)

        // Get the created product
        cy.request({
          method: 'GET',
          url: `/api/products/${productId}`
        }).then((getResponse) => {
          expect(getResponse.status).to.eq(200)
          expect(getResponse.body.product).to.have.property('name', 'E2E Test Product')
          expect(getResponse.body.product).to.have.property('price', 49.99)

          // Update the product
          cy.request({
            method: 'PUT',
            url: `/api/products/${productId}`,
            headers: {
              Authorization: `Bearer ${authToken}`
            },
            body: {
              name: 'Updated E2E Test Product',
              price: 59.99
            }
          }).then((updateResponse) => {
            expect(updateResponse.status).to.eq(200)

            // Verify the update
            cy.request({
              method: 'GET',
              url: `/api/products/${productId}`
            }).then((verifyResponse) => {
              expect(verifyResponse.body.product).to.have.property('name', 'Updated E2E Test Product')
              expect(verifyResponse.body.product).to.have.property('price', 59.99)

              // Delete the product
              cy.request({
                method: 'DELETE',
                url: `/api/products/${productId}`,
                headers: {
                  Authorization: `Bearer ${authToken}`
                }
              }).then((deleteResponse) => {
                expect(deleteResponse.status).to.eq(200)

                // Verify deletion
                cy.request({
                  method: 'GET',
                  url: `/api/products/${productId}`,
                  failOnStatusCode: false
                }).then((notFoundResponse) => {
                  expect(notFoundResponse.status).to.eq(404)
                })
              })
            })
          })
        })
      })
    })
  })

  it('should handle error scenarios gracefully', () => {
    // Test invalid registration
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: {
        username: 'test',
        email: 'invalid-email',
        password: 'weak'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body).to.have.property('error', 'Validation failed')
    })

    // Test invalid login
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('error', 'Invalid credentials')
    })

    // Test accessing protected endpoint without token
    cy.request({
      method: 'GET',
      url: '/api/auth/me',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('error', 'Access token required')
    })

    // Test non-existent product
    cy.request({
      method: 'GET',
      url: '/api/products/99999',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(404)
      expect(response.body).to.have.property('error', 'Product not found')
    })
  })
})
