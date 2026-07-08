/**
 * Authentication Middleware
 * 
 * Verifies the JWT from the Authorization header and attaches the
 * decoded user payload ({ userId, username }) to `req.user`.
 * Returns 401 on missing or invalid tokens.
 */

const jwt = require('jsonwebtoken');

/**
 * Express middleware — protects routes that require authentication.
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Expect "Bearer <token>" format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Token is empty.' });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to the request object for downstream handlers
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (err) {
    // Handle specific JWT errors for better client feedback
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }
    return res.status(401).json({ error: 'Authentication failed.' });
  }
}

module.exports = authMiddleware;
