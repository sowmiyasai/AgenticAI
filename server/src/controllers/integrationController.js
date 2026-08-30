const integrationService = require('../services/integrationService');

class IntegrationController {
  async getIntegrations(req, res, next) {
    try {
      const data = await integrationService.getUserIntegrations(req.user.id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req, res, next) {
    try {
      const data = await integrationService.getIntegrationStatus(req.user.id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async startOAuth(req, res, next) {
    try {
      const { provider } = req.params;
      const authUrl = await integrationService.startOAuth(provider, req.user.id);
      res.status(200).json({
        success: true,
        authUrl,
      });
    } catch (err) {
      next(err);
    }
  }

  async handleOAuthCallback(req, res, next) {
    try {
      const { provider } = req.params;
      const { code, state } = req.query;

      const result = await integrationService.handleOAuthCallback(provider, code, state);
      
      // Redirect back to client integrations page with success indicator
      res.redirect(`/integrations?status=success&provider=${provider}`);
    } catch (err) {
      console.error('[OAuth Callback Error]:', err);
      res.redirect(`/integrations?status=error&provider=${req.params.provider}&message=${encodeURIComponent(err.message)}`);
    }
  }

  async oauthError(req, res) {
    res.status(400).json({
      success: false,
      error: 'OAuth Authorization failed or was denied by the user.',
    });
  }

  async saveCredentials(req, res, next) {
    try {
      const { provider, credentials, accountEmail, accountName } = req.body;
      const result = await integrationService.saveManualCredentials(req.user.id, {
        provider,
        credentials,
        accountEmail,
        accountName,
      });

      res.status(200).json({
        success: true,
        message: `${provider} integration credentials saved successfully`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new IntegrationController();
