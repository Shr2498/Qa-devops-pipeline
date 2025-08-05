const express = require('express')
const { User } = require('../models/User')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Get all users (authenticated, admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.findAll()

    // Remove sensitive information
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }))

    res.json({
      users: sanitizedUsers,
      count: sanitizedUsers.length
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get users error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve users'
    })
  }
})

// Get user by ID (authenticated)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a number'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: `User with ID ${userId} does not exist`
      })
    }

    // Remove sensitive information
    const sanitizedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }

    res.json({ user: sanitizedUser })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get user error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user'
    })
  }
})

module.exports = router
