describe('API Health Check E2E', () => {
  beforeEach(() => {
    // Visit the health endpoint before each test
    cy.request('GET', '/health').as('healthCheck')
  })

  it('should return healthy status', () => {
    cy.get('@healthCheck').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('status', 'healthy')
      expect(response.body).to.have.property('timestamp')
      expect(response.body).to.have.property('version')
    })
  })

  it('should respond within acceptable time', () => {
    cy.request({
      method: 'GET',
      url: '/health',
      timeout: 5000
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.duration).to.be.lessThan(1000) // Should respond within 1 second
    })
  })
})
