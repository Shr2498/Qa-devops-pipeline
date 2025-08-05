const express = require('express')
const Joi = require('joi')
const { Product } = require('../models/Product')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Validation schemas
const productSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500),
  price: Joi.number().positive().precision(2).required(),
  category: Joi.string().min(1).max(50).required(),
  stock: Joi.number().integer().min(0).required()
})

const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  description: Joi.string().max(500),
  price: Joi.number().positive().precision(2),
  category: Joi.string().min(1).max(50),
  stock: Joi.number().integer().min(0)
}).min(1)

// Get all products
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const { category } = req.query

    const products = await Product.findAll({
      page,
      limit,
      category
    })

    res.json({
      products: products.data,
      pagination: {
        page: products.page,
        limit: products.limit,
        total: products.total,
        totalPages: Math.ceil(products.total / products.limit)
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get products error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve products'
    })
  }
})

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id)
    if (isNaN(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID',
        message: 'Product ID must be a number'
      })
    }

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: `Product with ID ${productId} does not exist`
      })
    }

    res.json({ product })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get product error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve product'
    })
  }
})

// Create product (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = productSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      })
    }

    const productId = await Product.create(value)

    res.status(201).json({
      message: 'Product created successfully',
      productId
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create product error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create product'
    })
  }
})

// Update product (authenticated)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const productId = parseInt(req.params.id)
    if (isNaN(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID',
        message: 'Product ID must be a number'
      })
    }

    const { error, value } = updateProductSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details[0].message
      })
    }

    const updated = await Product.update(productId, value)
    if (!updated) {
      return res.status(404).json({
        error: 'Product not found',
        message: `Product with ID ${productId} does not exist`
      })
    }

    res.json({
      message: 'Product updated successfully'
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update product error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update product'
    })
  }
})

// Delete product (authenticated)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const productId = parseInt(req.params.id)
    if (isNaN(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID',
        message: 'Product ID must be a number'
      })
    }

    const deleted = await Product.delete(productId)
    if (!deleted) {
      return res.status(404).json({
        error: 'Product not found',
        message: `Product with ID ${productId} does not exist`
      })
    }

    res.json({
      message: 'Product deleted successfully'
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Delete product error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete product'
    })
  }
})

module.exports = router
