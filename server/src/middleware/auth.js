const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No authorization token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User associated with this token no longer exists.',
      });
    }

    req.user = {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'operator',
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'AUTH_EXPIRED: Session expired. Please log in again.',
      });
    }
    return res.status(403).json({
      success: false,
      error: 'Invalid or malformed authorization token.',
    });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Requires ${role} role privileges.`,
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
};
