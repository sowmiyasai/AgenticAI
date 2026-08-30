const config = require('../config/env');

function errorHandler(err, req, res, next) {
  console.error('[Error Middleware]:', err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const errorCode = err.code || (err.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR');

  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected server error occurred',
    code: errorCode,
    details: err.details || null,
    ...(config.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
