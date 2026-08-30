const Integration = require('../models/Integration');
const cryptoUtils = require('../utils/crypto');
const gmailIntegration = require('../integrations/gmailIntegration');
const slackIntegration = require('../integrations/slackIntegration');
const discordIntegration = require('../integrations/discordIntegration');
const googleSheetsIntegration = require('../integrations/googleSheetsIntegration');

class IntegrationService {
  constructor() {
    this.integrations = {
      gmail: gmailIntegration,
      slack: slackIntegration,
      discord: discordIntegration,
      'google-sheets': googleSheetsIntegration,
    };
  }

  getIntegrationHandler(provider) {
    const handler = this.integrations[provider];
    if (!handler) {
      const err = new Error(`Unsupported integration provider: ${provider}`);
      err.statusCode = 400;
      throw err;
    }
    return handler;
  }

  async getUserIntegrations(userId) {
    const integrations = await Integration.find({ owner: userId });
    const providers = ['gmail', 'slack', 'discord', 'google-sheets'];

    return providers.map((provider) => {
      const existing = integrations.find((item) => item.provider === provider);
      return {
        provider,
        isConnected: existing ? existing.isConnected : false,
        accountEmail: existing ? existing.accountEmail : '',
        accountName: existing ? existing.accountName : '',
        scopes: existing ? existing.scopes : [],
        lastSync: existing ? existing.lastSync : null,
        expiresAt: existing ? existing.expiresAt : null,
      };
    });
  }

  async getIntegrationStatus(userId) {
    const integrations = await this.getUserIntegrations(userId);
    const results = {};

    for (const item of integrations) {
      if (item.isConnected) {
        const fullDoc = await Integration.findOne({ owner: userId, provider: item.provider });
        const decryptedTokens = fullDoc && fullDoc.encryptedTokens ? cryptoUtils.decrypt(fullDoc.encryptedTokens) : null;
        const handler = this.integrations[item.provider];
        try {
          const testRes = handler ? await handler.testConnection(decryptedTokens) : { valid: true };
          results[item.provider] = {
            isConnected: true,
            status: testRes.valid ? 'HEALTHY' : 'NEEDS_REAUTH',
            accountEmail: item.accountEmail,
            accountName: item.accountName,
            isMock: testRes.isMock || false,
          };
        } catch (err) {
          results[item.provider] = {
            isConnected: false,
            status: 'ERROR',
            error: err.message,
          };
        }
      } else {
        results[item.provider] = {
          isConnected: false,
          status: 'DISCONNECTED',
        };
      }
    }

    return results;
  }

  async startOAuth(provider, userId) {
    const handler = this.getIntegrationHandler(provider);
    const state = JSON.stringify({ userId, provider, timestamp: Date.now() });
    return handler.getAuthUrl(Buffer.from(state).toString('base64'));
  }

  async handleOAuthCallback(provider, code, state, redirectUri) {
    let userId = null;
    try {
      if (state) {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
        userId = decodedState.userId;
      }
    } catch (e) {
      console.warn('[Integration] Could not decode OAuth state:', e.message);
    }

    const handler = this.getIntegrationHandler(provider);
    const tokenResult = await handler.handleCallback(code, redirectUri);

    const encrypted = cryptoUtils.encrypt({
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
      isMock: tokenResult.isMock || false,
    });

    const integrationData = {
      owner: userId || 'default_user',
      provider,
      isConnected: true,
      accountEmail: tokenResult.accountEmail || '',
      accountName: tokenResult.accountName || '',
      scopes: tokenResult.scopes || [],
      encryptedTokens: encrypted,
      expiresAt: tokenResult.expiresAt || null,
      lastSync: new Date(),
      metadata: tokenResult.metadata || {},
    };

    let existing = await Integration.findOne({ owner: integrationData.owner, provider });
    if (existing) {
      existing = await Integration.findByIdAndUpdate(existing._id || existing.id, integrationData, { new: true });
    } else {
      existing = await Integration.create(integrationData);
    }

    return {
      provider,
      isConnected: true,
      accountEmail: existing.accountEmail,
      accountName: existing.accountName,
    };
  }

  async saveManualCredentials(userId, { provider, credentials, accountEmail, accountName }) {
    const encrypted = cryptoUtils.encrypt(credentials);

    const integrationData = {
      owner: userId,
      provider,
      isConnected: true,
      accountEmail: accountEmail || 'manual@agentflow.io',
      accountName: accountName || `${provider} (Manual API Token)`,
      encryptedTokens: encrypted,
      lastSync: new Date(),
    };

    let existing = await Integration.findOne({ owner: userId, provider });
    if (existing) {
      existing = await Integration.findByIdAndUpdate(existing._id || existing.id, integrationData, { new: true });
    } else {
      existing = await Integration.create(integrationData);
    }

    return {
      provider,
      isConnected: true,
      accountEmail: existing.accountEmail,
      accountName: existing.accountName,
    };
  }

  async executeProviderAction(userId, provider, action, params = {}) {
    const handler = this.getIntegrationHandler(provider);
    const integrationDoc = await Integration.findOne({ owner: userId, provider });

    let credentials = null;
    if (integrationDoc && integrationDoc.encryptedTokens) {
      credentials = cryptoUtils.decrypt(integrationDoc.encryptedTokens);
    }

    // Run action through integration handler
    return handler.executeAction(action, params, credentials);
  }
}

module.exports = new IntegrationService();
