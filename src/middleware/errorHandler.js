const checkValidationErrors = (error) => {
  if (error.name === 'ValidationError') {
    return { status: 400, message: 'Validation failed', details: error.details }
  }
  if (error.name === 'CastError') {
    return { status: 400, message: 'Invalid data format', details: null }
  }
  return null
}

const checkAuthErrors = (error) => {
  if (error.name === 'UnauthorizedError') {
    return { status: 401, message: 'Unauthorized access', details: null }
  }
  return null
}

const checkDatabaseErrors = (error) => {
  if (error.code === 11000) {
    return { status: 409, message: 'Duplicate entry detected', details: null }
  }
  return null
}

const checkRequestErrors = (error) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return { status: 400, message: 'Invalid JSON in request body', details: null }
  }
  if (error.name === 'PayloadTooLargeError' || error.message === 'request entity too large') {
    return { status: 413, message: 'Request payload too large', details: null }
  }
  return null
}

const getErrorDetails = (error) => {
  const validationError = checkValidationErrors(error)
  if (validationError) return validationError

  const authError = checkAuthErrors(error)
  if (authError) return authError

  const dbError = checkDatabaseErrors(error)
  if (dbError) return dbError

  const requestError = checkRequestErrors(error)
  if (requestError) return requestError

  // Default case
  return {
    status: 500,
    message: error.message || 'Internal server error',
    details: null
  }
}

const errorHandler = (error, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  let { status, message, details } = getErrorDetails(error)

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
