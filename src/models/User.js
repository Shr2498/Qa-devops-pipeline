// Mock User model (in production, this would connect to a real database)
class User {
  constructor () {
    this.users = [
      {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$12$example.hash', // In real app, this would be properly hashed
        createdAt: new Date('2024-01-01T00:00:00Z')
      }
    ]
    this.nextId = 2
  }

  async findAll () {
    return this.users
  }

  async findById (id) {
    return this.users.find(user => user.id === id)
  }

  async findByEmail (email) {
    return this.users.find(user => user.email === email)
  }

  async create (userData) {
    const user = {
      id: this.nextId++,
      ...userData,
      createdAt: new Date()
    }
    this.users.push(user)
    return user.id
  }

  async update (id, userData) {
    const userIndex = this.users.findIndex(user => user.id === id)
    if (userIndex === -1) return false

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      updatedAt: new Date()
    }
    return true
  }

  async delete (id) {
    const userIndex = this.users.findIndex(user => user.id === id)
    if (userIndex === -1) return false

    this.users.splice(userIndex, 1)
    return true
  }
}

// Singleton instance
const userInstance = new User()

module.exports = { User: userInstance }
