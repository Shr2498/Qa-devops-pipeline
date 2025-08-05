const errorHandler = (error, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  let status = 500
  let message = error.message || 'Internal server error'
  let details = null

  // Handle specific error types
  if (error.name === 'ValidationError') {
    status = 400
    message = 'Validation failed'
    ;({ details } = error)
  } else if (error.name === 'UnauthorizedError') {
    status = 401
    message = 'Unauthorized access'
  } else if (error.name === 'CastError') {
    status = 400
    message = 'Invalid data format'
  } else if (error.code === 11000) {
    // MongoDB duplicate key error
    status = 409
    message = 'Duplicate entry detected'
  } else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    // JSON parsing error
    status = 400
    message = 'Invalid JSON in request body'
  } else if (error.name === 'PayloadTooLargeError' || error.message === 'request entity too large') {
    // Payload too large error
    status = 413
    message = 'Request payload too large'
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && status === 500) {
    message = 'Something went wrong'
    details = null
  }

  const errorResponse = {
    error: message,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  }

  if (details) {
    errorResponse.details = details
  }

  // Add request ID if available
  if (req.requestId) {
    errorResponse.requestId = req.requestId
  }

  res.status(status).json(errorResponse)
}

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = {
  errorHandler,
  asyncHandler
}
