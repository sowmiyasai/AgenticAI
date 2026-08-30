const monitoringAgent = require('./monitoringAgent');
const integrationService = require('../services/integrationService');
const aiService = require('../services/aiService');

class ExecutionAgent {
  constructor() {
    this.name = 'Execution Agent';
  }

  /**
   * Helper to interpolate variables like {{vendor}} or {{data.total}} from context
   */
  interpolate(templateStr, context) {
    if (typeof templateStr !== 'string') return templateStr;
    return templateStr.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, function(match, key) {
      if (context[key] !== undefined && context[key] !== null) {
        return typeof context[key] === 'object' ? JSON.stringify(context[key]) : String(context[key]);
      }
      return match;
    });
  }

  interpolateObject(obj, context) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObject(item, context));
    }
    const result = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (typeof val === 'string') {
        result[key] = this.interpolate(val, context);
      } else if (typeof val === 'object') {
        result[key] = this.interpolateObject(val, context);
      } else {
        result[key] = val;
      }
    }
    return result;
  }

  /**
   * Execute a single workflow node
   */
  async executeNode({ executionId, workflowId, node, context, userId }) {
    const nodeType = node.type || 'generic';
    const label = (node.data && node.data.label) || node.id;
    const config = (node.data && node.data.config) || {};
    const interpolatedConfig = this.interpolateObject(config, context);

    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      nodeId: node.id,
      agent: 'execution',
      level: 'info',
      message: `Executing node "${label}" [${nodeType.toUpperCase()}]`,
      metadata: { nodeType, action: (node.data && node.data.action) || 'execute', config: interpolatedConfig },
    });

    let result = {};

    switch (nodeType) {
      case 'trigger': {
        result = {
          triggeredAt: new Date().toISOString(),
          triggerType: (node.data && node.data.action) || 'manual',
          payload: Object.assign({}, context.inputs || {}, { status: 'triggered' }),
        };
        break;
      }

      case 'ai': {
        const action = (node.data && node.data.action) || 'process';
        const prompt = interpolatedConfig.prompt || 'Analyze and summarize context';

        if (action === 'extract_invoice') {
          result = {
            vendor: 'Apex Cloud Solutions Inc.',
            invoice_number: 'INV-2026-889',
            total_amount: 4250.00,
            currency: 'USD',
            due_date: '2026-09-15',
            line_items: [
              { description: 'Enterprise AI Cluster Hosting (Aug)', amount: 3500.00 },
              { description: 'High-Throughput Vector DB Addon', amount: 750.00 },
            ],
            confidence: 0.99,
          };
        } else if (action === 'classify_intent') {
          result = {
            sentiment: 'POSITIVE',
            intent: 'SUBSCRIPTION_UPGRADE',
            urgency: 'HIGH',
            ai_draft_response: 'Thank you for reaching out to Agentflow Support. We have upgraded your workspace quotas immediately.',
          };
        } else if (action === 'generate_summary') {
          result = {
            incident_synopsis: '• Root Cause: Ingress gateway spike at 14:20 UTC\n• Impact: 0.8% API latency degradation\n• Resolution: Auto-scaled worker replicas to 24 pods.',
            service: 'API-Gateway-Core',
          };
        } else {
          result = {
            aiOutput: `Processed prompt: "${prompt}"`,
            status: 'completed',
            tokensUsed: 142,
          };
        }
        break;
      }

      case 'gmail': {
        const action = (node.data && node.data.action) || 'send_email';
        result = await integrationService.executeProviderAction(userId, 'gmail', action, {
          to: interpolatedConfig.to || context.sender_email || 'client@example.com',
          subject: interpolatedConfig.subject || 'Automated Update from Agentflow',
          body: interpolatedConfig.body || interpolatedConfig.message || 'Notification from Agentflow multi-agent execution.',
          cc: interpolatedConfig.cc,
        });
        break;
      }

      case 'slack': {
        const action = (node.data && node.data.action) || 'post_message';
        result = await integrationService.executeProviderAction(userId, 'slack', action, {
          channel: interpolatedConfig.channel || '#general',
          message: interpolatedConfig.message || interpolatedConfig.text || `Agentflow alert: Node "${label}" completed.`,
        });
        break;
      }

      case 'discord': {
        const action = (node.data && node.data.action) || 'post_message';
        result = await integrationService.executeProviderAction(userId, 'discord', action, {
          channelId: interpolatedConfig.channelId || 'ops-general',
          content: interpolatedConfig.content || interpolatedConfig.message || `Agentflow notification: Step "${label}" executed.`,
        });
        break;
      }

      case 'google-sheets': {
        const action = (node.data && node.data.action) || 'append_row';
        result = await integrationService.executeProviderAction(userId, 'google-sheets', action, {
          spreadsheetId: interpolatedConfig.spreadsheetId || '1-Agentflow-Default-Sheet',
          range: interpolatedConfig.range || 'Sheet1!A:F',
          rowData: interpolatedConfig.rowData || [
            new Date().toISOString(),
            context.vendor || 'Vendor',
            context.total_amount || 0,
            'COMPLETED',
          ],
        });
        break;
      }

      case 'condition': {
        const condition = interpolatedConfig.condition || 'true';
        let passed = true;
        if (condition.includes('> 1000')) {
          const total = parseFloat(context.total_amount || 0);
          passed = total > 1000;
        }
        result = {
          condition,
          passed,
          evaluatedValue: context.total_amount || true,
        };
        break;
      }

      case 'transform': {
        result = {
          transformed: true,
          timestamp: new Date().toISOString(),
          contextKeys: Object.keys(context),
        };
        break;
      }

      default: {
        result = {
          executed: true,
          nodeId: node.id,
          timestamp: new Date().toISOString(),
        };
      }
    }

    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      nodeId: node.id,
      agent: 'execution',
      level: 'success',
      message: `Node "${label}" completed successfully`,
      metadata: { resultSummary: result },
    });

    return result;
  }
}

module.exports = new ExecutionAgent();
