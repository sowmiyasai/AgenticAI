const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array().map(function(err) {
        return {
          field: err.param || err.path,
          message: err.msg,
          value: err.value,
        };
      }),
    });
  }
  next();
}

module.exports = {
  validate,
};
