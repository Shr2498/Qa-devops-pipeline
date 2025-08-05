// Cypress E2E support commands

// Custom command for API authentication

Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      email,
      password
    }
  }).then((response) => {
    window.localStorage.setItem('authToken', response.body.token)
    return response.body.token
  })
})

// Custom command for creating test data
Cypress.Commands.add('createTestProduct', (token, productData) => {
  cy.request({
    method: 'POST',
    url: '/api/products',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: productData
  })
})

// Custom command for cleanup
Cypress.Commands.add('cleanupTestData', (token, productId) => {
  cy.request({
    method: 'DELETE',
    url: `/api/products/${productId}`,
    headers: {
      Authorization: `Bearer ${token}`
    },
    failOnStatusCode: false
  })
})

// Alternatively you can use CommonJS syntax:
// require('./commands');
