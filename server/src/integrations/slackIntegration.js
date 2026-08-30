const BaseIntegration = require('./baseIntegration');
const config = require('../config/env');
const axios = require('axios');

class SlackIntegration extends BaseIntegration {
  constructor() {
    super('slack', ['chat:write', 'channels:read', 'users:read', 'incoming-webhook']);
  }

  getAuthUrl(state) {
    if (!config.SLACK_CLIENT_ID) {
      return `${config.CLIENT_URL}/integrations?mock_provider=slack&state=${encodeURIComponent(state || '')}`;
    }
    const params = new URLSearchParams({
      client_id: config.SLACK_CLIENT_ID,
      redirect_uri: config.SLACK_REDIRECT_URI,
      scope: this.requiredScopes.join(','),
      state: state || '',
    });
    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  async handleCallback(code, redirectUri) {
    if (!config.SLACK_CLIENT_ID || !config.SLACK_CLIENT_SECRET) {
      return {
        accessToken: `xoxb-mock-slack-${Date.now()}`,
        accountName: 'Agentflow Ops Workspace',
        accountEmail: 'bot@agentflow.slack.com',
        scopes: this.requiredScopes,
        isMock: true,
      };
    }

    try {
      const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
        params: {
          client_id: config.SLACK_CLIENT_ID,
          client_secret: config.SLACK_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri || config.SLACK_REDIRECT_URI,
        },
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Slack OAuth access failed');
      }

      return {
        accessToken: response.data.access_token,
        accountName: response.data.team ? response.data.team.name : 'Slack Team',
        accountEmail: (response.data.authed_user && response.data.authed_user.id) || '',
        scopes: response.data.scope ? response.data.scope.split(',') : [],
        metadata: {
          teamId: response.data.team ? response.data.team.id : null,
          incomingWebhook: response.data.incoming_webhook || null,
        },
      };
    } catch (err) {
      throw this.formatError('AUTH_EXPIRED', 'Failed to exchange Slack OAuth code', err.message);
    }
  }

  async testConnection(credentials) {
    if (!credentials || !credentials.accessToken) {
      return { valid: false, reason: 'INTEGRATION_NOT_CONNECTED' };
    }
    if (credentials.isMock) {
      return { valid: true, isMock: true, teamName: credentials.accountName || 'Demo Ops Team' };
    }
    try {
      const res = await axios.post(
        'https://slack.com/api/auth.test',
        {},
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );
      return { valid: res.data.ok, teamName: res.data.team, user: res.data.user };
    } catch (err) {
      return { valid: false, reason: 'AUTH_EXPIRED', details: err.message };
    }
  }

  async executeAction(action, params = {}, credentials = null) {
    const isMock = !credentials || credentials.isMock || !credentials.accessToken;

    if (action === 'post_message') {
      const { channel, message, blocks } = params;
      const text = message || params.text || 'Agentflow Notification';
      const targetChannel = channel || '#general';

      if (isMock) {
        return {
          success: true,
          action: 'post_message',
          channel: targetChannel,
          message: text,
          ts: String(Date.now() / 1000),
          isSimulation: true,
          note: 'Slack notification posted via Agentflow Simulated Execution Engine (Connect real OAuth in Integrations for live sending)',
        };
      }

      const res = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: targetChannel,
          text,
          ...(blocks ? { blocks } : {}),
        },
        {
          headers: { Authorization: `Bearer ${credentials.accessToken}` },
        }
      );

      if (!res.data.ok) {
        throw this.formatError('API_FAILURE', `Slack API Error: ${res.data.error}`);
      }

      return {
        success: true,
        channel: res.data.channel,
        ts: res.data.ts,
        message: res.data.message,
      };
    }

    if (action === 'list_channels') {
      if (isMock) {
        return {
          success: true,
          channels: [
            { id: 'C0123GENERAL', name: 'general', is_private: false },
            { id: 'C0456ALERTS', name: 'ops-alerts', is_private: false },
            { id: 'C0789FINANCE', name: 'finance-invoices', is_private: false },
          ],
          isSimulation: true,
        };
      }

      const res = await axios.get('https://slack.com/api/conversations.list', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
      });

      return {
        success: true,
        channels: res.data.channels || [],
      };
    }

    throw this.formatError('API_FAILURE', `Unknown Slack action: ${action}`);
  }
}

module.exports = new SlackIntegration();
