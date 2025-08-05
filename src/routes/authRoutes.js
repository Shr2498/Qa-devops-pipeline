const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Joi = require('joi')
const { User } = require('../models/User')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      })
    }

    const { username, email, password } = value

    // Check if user already exists
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'Email is already registered'
      })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const userId = await User.create({
      username,
      email,
      password: hashedPassword
    })

    res.status(201).json({
      message: 'User created successfully',
      userId
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Registration error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user'
    })
  }
})

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      })
    }

    const { email, password } = value

    // Find user
    const user = await User.findByEmail(email)
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to authenticate user'
    })
  }
})

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get user error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve user information'
    })
  }
})

module.exports = router
