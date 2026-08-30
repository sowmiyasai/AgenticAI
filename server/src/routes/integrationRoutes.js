const express = require('express');
const { body } = require('express-validator');
const integrationController = require('../controllers/integrationController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Public OAuth callback endpoints
router.get('/oauth/:provider/callback', integrationController.handleOAuthCallback);
router.get('/oauth/error', integrationController.oauthError);

// Protected integration management endpoints
router.get('/', authenticateToken, integrationController.getIntegrations);
router.get('/status', authenticateToken, integrationController.getStatus);
router.get('/oauth/:provider/start', authenticateToken, integrationController.startOAuth);
router.post(
  '/',
  authenticateToken,
  [
    body('provider').isIn(['gmail', 'slack', 'discord', 'google-sheets']).withMessage('Valid provider is required'),
    body('credentials').notEmpty().withMessage('Credentials payload is required'),
  ],
  validate,
  integrationController.saveCredentials
);

module.exports = router;
