// Mock Product model (in production, this would connect to a real database)
class Product {
  constructor () {
    this.products = [
      {
        id: 1,
        name: 'Sample Product',
        description: 'A sample product for testing',
        price: 29.99,
        category: 'Electronics',
        stock: 100,
        createdAt: new Date('2024-01-01T00:00:00Z')
      },
      {
        id: 2,
        name: 'Test Widget',
        description: 'A test widget for demonstration',
        price: 15.50,
        category: 'Tools',
        stock: 50,
        createdAt: new Date('2024-01-02T00:00:00Z')
      }
    ]
    this.nextId = 3
  }

  async findAll ({ page = 1, limit = 10, category = null } = {}) {
    let filteredProducts = this.products

    if (category) {
      filteredProducts = this.products.filter(
        product => product.category.toLowerCase() === category.toLowerCase()
      )
    }

    const total = filteredProducts.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const data = filteredProducts.slice(startIndex, endIndex)

    return {
      data,
      total,
      page,
      limit
    }
  }

  async findById (id) {
    return this.products.find(product => product.id === id)
  }

  async create (productData) {
    const product = {
      id: this.nextId++,
      ...productData,
      createdAt: new Date()
    }
    this.products.push(product)
    return product.id
  }

  async update (id, productData) {
    const productIndex = this.products.findIndex(product => product.id === id)
    if (productIndex === -1) return false

    this.products[productIndex] = {
      ...this.products[productIndex],
      ...productData,
      updatedAt: new Date()
    }
    return true
  }

  async delete (id) {
    const productIndex = this.products.findIndex(product => product.id === id)
    if (productIndex === -1) return false

    this.products.splice(productIndex, 1)
    return true
  }

  async findByCategory (category) {
    return this.products.filter(
      product => product.category.toLowerCase() === category.toLowerCase()
    )
  }
}

// Singleton instance
const productInstance = new Product()

module.exports = { Product: productInstance }
