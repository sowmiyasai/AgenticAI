const BaseIntegration = require('./baseIntegration');
const config = require('../config/env');
const axios = require('axios');

class GoogleSheetsIntegration extends BaseIntegration {
  constructor() {
    super('google-sheets', [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly',
    ]);
  }

  getAuthUrl(state) {
    if (!config.GOOGLE_CLIENT_ID) {
      return `${config.CLIENT_URL}/integrations?mock_provider=google-sheets&state=${encodeURIComponent(state || '')}`;
    }
    const params = new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID,
      redirect_uri: config.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: this.requiredScopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: state || '',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleCallback(code, redirectUri) {
    if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
      return {
        accessToken: `mock_sheets_access_${Date.now()}`,
        refreshToken: `mock_sheets_refresh_${Date.now()}`,
        accountEmail: 'operator@agentflow.io',
        accountName: 'Agentflow Google Sheets User',
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        isMock: true,
      };
    }

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: config.GOOGLE_CLIENT_ID,
        client_secret: config.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri || config.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      });

      const { access_token, refresh_token, expires_in } = response.data;
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
      throw this.formatError('AUTH_EXPIRED', 'Failed to exchange Google Sheets OAuth token', err.message);
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
    const isMock = !credentials || credentials.isMock || !credentials.accessToken;

    if (action === 'append_row') {
      const { spreadsheetId, range, values, rowData } = params;
      const row = values || rowData || ['Agentflow Run', new Date().toISOString(), 'Completed'];

      if (isMock) {
        return {
          success: true,
          action: 'append_row',
          spreadsheetId: spreadsheetId || '1MockSpreadsheetId_Agentflow_2026',
          range: range || 'Sheet1!A:E',
          updatedRows: 1,
          updatedColumns: Array.isArray(row) ? row.length : 1,
          updatedCells: Array.isArray(row) ? row.length : 1,
          appendedValues: row,
          isSimulation: true,
          timestamp: new Date().toISOString(),
          note: 'Row recorded via Agentflow Simulated Google Sheets Engine',
        };
      }

      if (!spreadsheetId) {
        throw this.formatError('MISSING_FIELDS', 'spreadsheetId is required to append row');
      }

      const appendRange = range || 'Sheet1!A:Z';
      const formattedValues = Array.isArray(row) && Array.isArray(row[0]) ? row : [Array.isArray(row) ? row : [row]];

      const res = await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(appendRange)}:append?valueInputOption=USER_ENTERED`,
        { values: formattedValues },
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );

      return {
        success: true,
        action: 'append_row',
        spreadsheetId,
        updates: res.data.updates,
      };
    }

    if (action === 'read_range') {
      const { spreadsheetId, range } = params;
      if (isMock) {
        return {
          success: true,
          action: 'read_range',
          spreadsheetId: spreadsheetId || '1MockSpreadsheetId_Agentflow_2026',
          range: range || 'Sheet1!A1:D10',
          values: [
            ['Timestamp', 'Event', 'Status', 'Payload'],
            [new Date().toISOString(), 'Invoice Ingestion', 'SUCCESS', '{"amount": 4250, "currency": "USD"}'],
            [new Date().toISOString(), 'Slack Notification', 'SENT', '{"channel": "#finance"}'],
          ],
          isSimulation: true,
        };
      }

      const res = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range || 'Sheet1!A1:Z50')}`,
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );

      return {
        success: true,
        action: 'read_range',
        range: res.data.range,
        values: res.data.values || [],
      };
    }

    throw this.formatError('API_FAILURE', `Unknown Google Sheets action: ${action}`);
  }
}

module.exports = new GoogleSheetsIntegration();
