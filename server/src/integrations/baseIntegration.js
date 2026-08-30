/**
 * Base Integration Class - Abstract Interface for all external service providers
 */
class BaseIntegration {
  constructor(providerName, requiredScopes = []) {
    this.provider = providerName;
    this.requiredScopes = requiredScopes;
  }

  /**
   * Generates OAuth Authorization URL
   */
  getAuthUrl(state) {
    throw new Error(`getAuthUrl not implemented for provider ${this.provider}`);
  }

  /**
   * Exchanges authorization code for tokens
   */
  async handleCallback(code, redirectUri) {
    throw new Error(`handleCallback not implemented for provider ${this.provider}`);
  }

  /**
   * Tests connection validity using decrypted tokens
   */
  async testConnection(tokens) {
    throw new Error(`testConnection not implemented for provider ${this.provider}`);
  }

  /**
   * Refreshes access tokens using refresh token
   */
  async refreshTokens(refreshToken) {
    throw new Error(`refreshTokens not implemented for provider ${this.provider}`);
  }

  /**
   * Dispatches and executes an integration action
   */
  async executeAction(action, params, credentials) {
    throw new Error(`executeAction not implemented for provider ${this.provider}`);
  }

  /**
   * Standard error formatter
   */
  formatError(code, message, details) {
    const err = new Error(message);
    err.code = code;
    err.details = details || null;
    return err;
  }
}

module.exports = BaseIntegration;
