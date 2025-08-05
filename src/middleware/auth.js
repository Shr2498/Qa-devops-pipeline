const jwt = require('jsonwebtoken')

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'No token provided in Authorization header'
    })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Please log in again'
        })
      }

      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({
          error: 'Invalid token',
          message: 'Token is malformed or invalid'
        })
      }

      return res.status(403).json({
        error: 'Token verification failed',
        message: 'Unable to verify token'
      })
    }

    req.userId = user.userId
    req.userEmail = user.email
    next()
  })
}

module.exports = {
  authenticateToken
}
