const BaseIntegration = require('./baseIntegration');
const config = require('../config/env');
const axios = require('axios');

class GmailIntegration extends BaseIntegration {
  constructor() {
    super('gmail', [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
    ]);
  }

  getAuthUrl(state) {
    if (!config.GMAIL_CLIENT_ID) {
      return `${config.CLIENT_URL}/integrations?mock_provider=gmail&state=${encodeURIComponent(state || '')}`;
    }
    const params = new URLSearchParams({
      client_id: config.GMAIL_CLIENT_ID,
      redirect_uri: config.GMAIL_REDIRECT_URI,
      response_type: 'code',
      scope: this.requiredScopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: state || '',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleCallback(code, redirectUri) {
    if (!config.GMAIL_CLIENT_ID || !config.GMAIL_CLIENT_SECRET) {
      // Return simulated connected credentials
      return {
        accessToken: `mock_gmail_access_${Date.now()}`,
        refreshToken: `mock_gmail_refresh_${Date.now()}`,
        accountEmail: 'operator@agentflow.io',
        accountName: 'Agentflow Operator',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        isMock: true,
      };
    }

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: config.GMAIL_CLIENT_ID,
        client_secret: config.GMAIL_CLIENT_SECRET,
        redirect_uri: redirectUri || config.GMAIL_REDIRECT_URI,
        grant_type: 'authorization_code',
      });

      const { access_token, refresh_token, expires_in } = response.data;
      
      // Fetch user profile
      const userProfile = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        accountEmail: userProfile.data.email,
        accountName: userProfile.data.name || userProfile.data.email,
        expiresAt: new Date(Date.now() + (expires_in || 3600) * 1000).toISOString(),
      };
    } catch (err) {
      throw this.formatError('AUTH_EXPIRED', 'Failed to exchange Gmail authorization code', err.response ? err.response.data : err.message);
    }
  }

  async testConnection(credentials) {
    if (!credentials || !credentials.accessToken) {
      return { valid: false, reason: 'INTEGRATION_NOT_CONNECTED' };
    }
    if (credentials.isMock) {
      return { valid: true, isMock: true, accountEmail: credentials.accountEmail || 'operator@agentflow.io' };
    }
    try {
      const res = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
      });
      return { valid: true, accountEmail: res.data.email };
    } catch (err) {
      return { valid: false, reason: 'AUTH_EXPIRED', details: err.message };
    }
  }

  async executeAction(action, params = {}, credentials = null) {
    // If not connected, check if action allows simulated run
    const isMock = !credentials || credentials.isMock || !credentials.accessToken;

    if (action === 'send_email') {
      const { to, subject, body, cc } = params;
      if (!to) {
        throw this.formatError('MISSING_FIELDS', 'Destination "to" email address is required');
      }

      if (isMock) {
        return {
          success: true,
          action: 'send_email',
          messageId: `msg_${Date.now()}_simulated`,
          to,
          subject: subject || '(No Subject)',
          status: 'sent_simulated',
          timestamp: new Date().toISOString(),
          note: 'Gmail sent via Agentflow Simulated Execution Engine (connect real OAuth in Integrations for live sending)',
        };
      }

      // Real Gmail API call
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject || '').toString('base64')}?=`;
      const messageParts = [
        `To: ${to}`,
        cc ? `Cc: ${cc}` : null,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        body || '',
      ].filter(Boolean);

      const rawMessage = Buffer.from(messageParts.join('\n'))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw: rawMessage },
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );

      return {
        success: true,
        action: 'send_email',
        messageId: response.data.id,
        threadId: response.data.threadId,
        to,
        subject,
        timestamp: new Date().toISOString(),
      };
    }

    if (action === 'read_messages' || action === 'search_emails') {
      if (isMock) {
        return {
          success: true,
          action: action,
          messages: [
            {
              id: 'sim_msg_001',
              from: 'invoicing@vendorcorp.com',
              subject: 'Invoice INV-2026-889 for Services Rendered',
              snippet: 'Attached is your monthly billing statement for $4,250.00 due on September 15th.',
              date: new Date().toISOString(),
            }
          ],
          totalCount: 1,
          isSimulation: true,
        };
      }

      const q = params.query || '';
      const listRes = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );

      return {
        success: true,
        messages: listRes.data.messages || [],
        resultSizeEstimate: listRes.data.resultSizeEstimate,
      };
    }

    throw this.formatError('API_FAILURE', `Unknown Gmail action: ${action}`);
  }
}

module.exports = new GmailIntegration();
