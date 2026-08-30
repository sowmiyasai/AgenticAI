const BaseIntegration = require('./baseIntegration');
const config = require('../config/env');
const axios = require('axios');

class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord', ['bot', 'identify', 'webhook.incoming']);
  }

  getAuthUrl(state) {
    if (!config.DISCORD_CLIENT_ID) {
      return `${config.CLIENT_URL}/integrations?mock_provider=discord&state=${encodeURIComponent(state || '')}`;
    }
    const params = new URLSearchParams({
      client_id: config.DISCORD_CLIENT_ID,
      redirect_uri: config.DISCORD_REDIRECT_URI,
      response_type: 'code',
      scope: 'bot identify',
      permissions: '2048', // Send Messages
      state: state || '',
    });
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  async handleCallback(code, redirectUri) {
    if (!config.DISCORD_CLIENT_ID || !config.DISCORD_CLIENT_SECRET) {
      return {
        accessToken: `mock_discord_bot_${Date.now()}`,
        accountName: 'Agentflow Operations Server',
        scopes: this.requiredScopes,
        isMock: true,
      };
    }

    try {
      const data = new URLSearchParams({
        client_id: config.DISCORD_CLIENT_ID,
        client_secret: config.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri || config.DISCORD_REDIRECT_URI,
      });

      const response = await axios.post('https://discord.com/api/v10/oauth2/token', data.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        accountName: (response.data.guild && response.data.guild.name) || 'Discord Guild',
        scopes: response.data.scope ? response.data.scope.split(' ') : [],
        metadata: response.data.guild || {},
      };
    } catch (err) {
      throw this.formatError('AUTH_EXPIRED', 'Failed to exchange Discord OAuth code', err.message);
    }
  }

  async testConnection(credentials) {
    if (!credentials || !credentials.accessToken) {
      return { valid: false, reason: 'INTEGRATION_NOT_CONNECTED' };
    }
    if (credentials.isMock) {
      return { valid: true, isMock: true, serverName: credentials.accountName || 'Discord Ops Guild' };
    }
    try {
      const res = await axios.get('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
      });
      return { valid: true, username: res.data.username };
    } catch (err) {
      return { valid: false, reason: 'AUTH_EXPIRED', details: err.message };
    }
  }

  async executeAction(action, params = {}, credentials = null) {
    const isMock = !credentials || credentials.isMock || !credentials.accessToken;

    if (action === 'post_message' || action === 'post_webhook') {
      const { channelId, webhookUrl, content, embeds } = params;
      const messageContent = content || params.message || 'Agentflow Automation Alert';

      if (isMock) {
        return {
          success: true,
          action: 'post_message',
          channelId: channelId || 'simulated-channel',
          content: messageContent,
          isSimulation: true,
          timestamp: new Date().toISOString(),
          note: 'Discord message dispatched via Agentflow Simulated Engine',
        };
      }

      if (webhookUrl) {
        const res = await axios.post(webhookUrl, {
          content: messageContent,
          ...(embeds ? { embeds } : {}),
        });
        return { success: true, status: res.status };
      }

      if (channelId) {
        const res = await axios.post(
          `https://discord.com/api/v10/channels/${channelId}/messages`,
          {
            content: messageContent,
            ...(embeds ? { embeds } : {}),
          },
          {
            headers: {
              Authorization: `Bot ${credentials.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return {
          success: true,
          messageId: res.data.id,
          channelId: res.data.channel_id,
        };
      }

      throw this.formatError('MISSING_FIELDS', 'Discord requires either channelId or webhookUrl');
    }

    throw this.formatError('API_FAILURE', `Unknown Discord action: ${action}`);
  }
}

module.exports = new DiscordIntegration();
