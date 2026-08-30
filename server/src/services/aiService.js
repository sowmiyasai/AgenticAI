const config = require('../config/env');
const axios = require('axios');

class AIService {
  /**
   * Main entry point to generate a workflow graph from a prompt
   */
  async generateWorkflowFromPrompt(prompt, options = {}) {
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      const err = new Error('Prompt is required for workflow generation');
      err.statusCode = 400;
      throw err;
    }

    const trimmedPrompt = prompt.trim();

    // 1. Try OpenRouter if key is present
    if (config.OPENROUTER_API_KEY) {
      try {
        console.log('[AI Service] Attempting OpenRouter generation...');
        const result = await this.generateViaOpenRouter(trimmedPrompt);
        if (result && result.nodes && result.nodes.length > 0) {
          result.generatedBy = 'OpenRouter (Claude 3.5 Sonnet / Llama 3)';
          return result;
        }
      } catch (err) {
        console.warn('[AI Service] OpenRouter failed, falling back:', err.message);
      }
    }

    // 2. Try Google Gemini if key is present
    if (config.GEMINI_API_KEY) {
      try {
        console.log('[AI Service] Attempting Gemini SDK generation...');
        const result = await this.generateViaGemini(trimmedPrompt);
        if (result && result.nodes && result.nodes.length > 0) {
          result.generatedBy = 'Google Gemini 1.5 Pro';
          return result;
        }
      } catch (err) {
        console.warn('[AI Service] Gemini failed, falling back:', err.message);
      }
    }

    // 3. Fallback to Deterministic Rule Engine
    console.log('[AI Service] Using Deterministic Rule-Based Builder');
    const deterministicResult = this.generateDeterministicWorkflow(trimmedPrompt);
    deterministicResult.generatedBy = 'Agentflow Deterministic Rule Engine';
    return deterministicResult;
  }

  async generateViaOpenRouter(prompt) {
    const systemPrompt = this.getSystemPrompt();
    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${config.OPENROUTER_API_KEY}`,
          'HTTP-Referer': config.CLIENT_URL,
          'X-Title': 'Agentflow AI Automation Platform',
        },
        timeout: 20000,
      }
    );

    const rawContent = res.data.choices[0].message.content;
    return this.parseAndSanitizeWorkflowJson(rawContent, prompt);
  }

  async generateViaGemini(prompt) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = this.getSystemPrompt();
    const result = await model.generateContent([
      systemPrompt,
      `User Automation Prompt: ${prompt}\nOutput valid JSON only.`,
    ]);

    const response = await result.response;
    const text = response.text();
    return this.parseAndSanitizeWorkflowJson(text, prompt);
  }

  getSystemPrompt() {
    return `You are an expert AI Operations Workflow Architect for Agentflow_AI.
Given a user prompt describing an automation, return a JSON object representing a valid React Flow graph.
The JSON must follow this exact structure:
{
  "name": "Concise workflow title",
  "description": "Clear 1-2 sentence description",
  "tags": ["Tag1", "Tag2"],
  "triggerConfig": {
    "type": "manual" | "webhook" | "schedule" | "event",
    "config": {}
  },
  "nodes": [
    {
      "id": "node_1",
      "type": "trigger" | "ai" | "gmail" | "slack" | "discord" | "google-sheets" | "condition" | "transform",
      "position": { "x": 250, "y": 100 },
      "data": {
        "label": "Human Readable Step Title",
        "description": "What this step does",
        "agentType": "planner" | "execution" | "validation" | "recovery" | "monitoring",
        "action": "e.g. send_email, post_message, append_row, extract_invoice, transform_data",
        "config": {
          // relevant configuration properties (e.g. to, subject, channel, spreadsheetId, prompt)
        }
      }
    }
  ],
  "edges": [
    {
      "id": "edge_node_1_node_2",
      "source": "node_1",
      "target": "node_2",
      "animated": true,
      "label": "Optional condition or flow label"
    }
  ]
}
Ensure node positions are staggered vertically/horizontally (e.g. y += 150 each step). Return ONLY the raw JSON.`;
  }

  parseAndSanitizeWorkflowJson(rawText, fallbackPrompt) {
    try {
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);
      if (parsed.nodes && parsed.nodes.length > 0) {
        return this.formatWorkflowOutput(parsed);
      }
    } catch (err) {
      console.warn('[AI Service] Failed to parse LLM JSON:', err.message);
    }
    return this.generateDeterministicWorkflow(fallbackPrompt);
  }

  formatWorkflowOutput(workflow) {
    return {
      name: workflow.name || 'AI Generated Automation',
      description: workflow.description || 'Automated multi-agent execution workflow',
      tags: Array.isArray(workflow.tags) ? workflow.tags : ['AI Generated', 'Automation'],
      triggerConfig: workflow.triggerConfig || { type: 'manual', config: {} },
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      version: 1,
      status: 'active',
    };
  }

  /**
   * Deterministic Rule Engine for instant offline workflow generation
   */
  generateDeterministicWorkflow(prompt) {
    const lower = prompt.toLowerCase();

    // 1. Invoice Processing & Finance Workflow
    if (lower.includes('invoice') || lower.includes('bill') || lower.includes('receipt') || lower.includes('finance')) {
      return {
        name: 'Automated Invoice Processing & Alerts',
        description: 'Ingests vendor invoices, extracts line items via AI, alerts Slack, and logs transaction to Google Sheets.',
        tags: ['Finance', 'Invoicing', 'AI Extraction', 'Slack', 'Sheets'],
        triggerConfig: { type: 'webhook', config: { endpoint: '/webhook/invoices', method: 'POST' } },
        nodes: [
          {
            id: 'node_trigger',
            type: 'trigger',
            position: { x: 300, y: 50 },
            data: {
              label: 'Webhook: Invoice Ingestion',
              description: 'Receives PDF/JSON invoice payload',
              agentType: 'planner',
              action: 'webhook_receive',
              config: { event: 'invoice.received', format: 'multipart/pdf' },
            },
          },
          {
            id: 'node_ai_extract',
            type: 'ai',
            position: { x: 300, y: 200 },
            data: {
              label: 'AI Agent: Line Item Extraction',
              description: 'Parses vendor name, total, due date & items',
              agentType: 'execution',
              action: 'extract_invoice',
              config: {
                model: 'gemini-1.5-flash',
                prompt: 'Extract vendor, total_amount, currency, due_date, and line_items into structured JSON.',
              },
            },
          },
          {
            id: 'node_validate',
            type: 'condition',
            position: { x: 300, y: 350 },
            data: {
              label: 'Validation Agent: Threshold Check',
              description: 'Verifies invoice total and checks budget approval threshold (> $1000)',
              agentType: 'validation',
              action: 'evaluate_condition',
              config: { condition: 'total_amount > 1000' },
            },
          },
          {
            id: 'node_slack',
            type: 'slack',
            position: { x: 150, y: 500 },
            data: {
              label: 'Slack: Finance Channel Alert',
              description: 'Posts invoice breakdown to #finance-alerts',
              agentType: 'execution',
              action: 'post_message',
              config: {
                channel: '#finance-alerts',
                message: '📋 *New Invoice Processed*\nVendor: {{vendor}}\nTotal: ${{total_amount}}\nDue Date: {{due_date}}',
              },
            },
          },
          {
            id: 'node_sheets',
            type: 'google-sheets',
            position: { x: 450, y: 500 },
            data: {
              label: 'Google Sheets: Audit Log',
              description: 'Appends invoice record into General Ledger spreadsheet',
              agentType: 'execution',
              action: 'append_row',
              config: {
                spreadsheetId: '1-Finance-General-Ledger-2026',
                range: 'Invoices!A:F',
                rowData: ['{{timestamp}}', '{{vendor}}', '{{total_amount}}', '{{currency}}', '{{due_date}}', 'APPROVED'],
              },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'node_trigger', target: 'node_ai_extract', animated: true },
          { id: 'e2', source: 'node_ai_extract', target: 'node_validate', animated: true },
          { id: 'e3', source: 'node_validate', target: 'node_slack', animated: true, label: 'Approved' },
          { id: 'e4', source: 'node_validate', target: 'node_sheets', animated: true, label: 'Always' },
        ],
        version: 1,
        status: 'active',
      };
    }

    // 2. Email Automation Workflow
    if (lower.includes('email') || lower.includes('gmail') || lower.includes('mail') || lower.includes('customer support')) {
      return {
        name: 'Intelligent Email Auto-Responder & Escalation',
        description: 'Monitors incoming support emails, classifies sentiment/urgency with AI, sends auto-reply, and escalates to Discord.',
        tags: ['Customer Support', 'Gmail', 'Discord', 'Sentiment Analysis'],
        triggerConfig: { type: 'schedule', config: { intervalMinutes: 15 } },
        nodes: [
          {
            id: 'node_gmail_read',
            type: 'gmail',
            position: { x: 300, y: 50 },
            data: {
              label: 'Gmail: Ingest Unread Support Emails',
              description: 'Polls unread emails labeled "Support"',
              agentType: 'planner',
              action: 'read_messages',
              config: { query: 'label:unread label:support' },
            },
          },
          {
            id: 'node_ai_classify',
            type: 'ai',
            position: { x: 300, y: 200 },
            data: {
              label: 'AI Agent: Sentiment & Intent Classifier',
              description: 'Determines urgency, customer sentiment, and draft answer',
              agentType: 'execution',
              action: 'classify_intent',
              config: {
                prompt: 'Classify sentiment (POSITIVE, NEUTRAL, URGENT) and generate a polite resolution draft.',
              },
            },
          },
          {
            id: 'node_gmail_reply',
            type: 'gmail',
            position: { x: 150, y: 350 },
            data: {
              label: 'Gmail: Send AI Auto-Resolution',
              description: 'Sends synthesized response to customer',
              agentType: 'execution',
              action: 'send_email',
              config: {
                to: '{{sender_email}}',
                subject: 'Re: {{subject}} - Agentflow Support',
                body: '{{ai_draft_response}}',
              },
            },
          },
          {
            id: 'node_discord_alert',
            type: 'discord',
            position: { x: 450, y: 350 },
            data: {
              label: 'Discord: Urgent Escalation Bot',
              description: 'Pings on-call engineers if email is tagged URGENT',
              agentType: 'recovery',
              action: 'post_message',
              config: {
                channelId: 'support-escalations-channel',
                content: '🚨 **Urgent Customer Ticket Escalated**\nSender: {{sender_email}}\nIssue: {{subject}}',
              },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'node_gmail_read', target: 'node_ai_classify', animated: true },
          { id: 'e2', source: 'node_ai_classify', target: 'node_gmail_reply', animated: true, label: 'Auto-Resolved' },
          { id: 'e3', source: 'node_ai_classify', target: 'node_discord_alert', animated: true, label: 'Urgent Flag' },
        ],
        version: 1,
        status: 'active',
      };
    }

    // 3. Slack / Discord Community & Operations Workflow
    if (lower.includes('slack') || lower.includes('discord') || lower.includes('notify') || lower.includes('alert')) {
      return {
        name: 'Cross-Platform Team Notification Pipeline',
        description: 'Receives incident triggers, summarizes impact, broadcasts simultaneously to Slack and Discord, and records to Sheets.',
        tags: ['Incident Response', 'Slack', 'Discord', 'Operations'],
        triggerConfig: { type: 'event', config: { event: 'system.incident' } },
        nodes: [
          {
            id: 'node_trigger',
            type: 'trigger',
            position: { x: 300, y: 50 },
            data: {
              label: 'Trigger: System Event Incident',
              description: 'Listens for high-priority operational telemetry',
              agentType: 'planner',
              action: 'event_listener',
              config: { severity: 'CRITICAL' },
            },
          },
          {
            id: 'node_ai_summary',
            type: 'ai',
            position: { x: 300, y: 190 },
            data: {
              label: 'AI Agent: Incident Synopsis',
              description: 'Generates concise 3-bullet incident synopsis & action items',
              agentType: 'execution',
              action: 'generate_summary',
              config: { prompt: 'Summarize root cause, affected services, and mitigation steps.' },
            },
          },
          {
            id: 'node_slack_broadcast',
            type: 'slack',
            position: { x: 120, y: 340 },
            data: {
              label: 'Slack: #ops-incident Channel',
              description: 'Broadcasts immediate alert to engineering team',
              agentType: 'execution',
              action: 'post_message',
              config: {
                channel: '#ops-incident',
                message: '🚨 *INCIDENT DECLARED*\n{{incident_synopsis}}',
              },
            },
          },
          {
            id: 'node_discord_broadcast',
            type: 'discord',
            position: { x: 480, y: 340 },
            data: {
              label: 'Discord: War-Room Announcement',
              description: 'Posts live updates to Discord #war-room',
              agentType: 'execution',
              action: 'post_message',
              config: {
                channelId: 'war-room-channel',
                content: '📢 **Active Incident Under Investigation**\n{{incident_synopsis}}',
              },
            },
          },
          {
            id: 'node_sheets_record',
            type: 'google-sheets',
            position: { x: 300, y: 480 },
            data: {
              label: 'Google Sheets: Post-Mortem Log',
              description: 'Records incident timestamp and details for SLA tracking',
              agentType: 'monitoring',
              action: 'append_row',
              config: {
                spreadsheetId: '1-Ops-Incidents-Log',
                range: 'SLA!A:E',
                rowData: ['{{timestamp}}', 'CRITICAL', '{{service}}', '{{incident_synopsis}}', 'OPEN'],
              },
            },
          },
        ],
        edges: [
          { id: 'e1', source: 'node_trigger', target: 'node_ai_summary', animated: true },
          { id: 'e2', source: 'node_ai_summary', target: 'node_slack_broadcast', animated: true },
          { id: 'e3', source: 'node_ai_summary', target: 'node_discord_broadcast', animated: true },
          { id: 'e4', source: 'node_ai_summary', target: 'node_sheets_record', animated: true },
        ],
        version: 1,
        status: 'active',
      };
    }

    // Default Generic Multi-Agent Automation Workflow
    return {
      name: prompt.length > 50 ? prompt.slice(0, 47) + '...' : prompt,
      description: `Automated agent pipeline configured for: "${prompt}"`,
      tags: ['Automation', 'AI Agents', 'Multi-Agent Flow'],
      triggerConfig: { type: 'manual', config: {} },
      nodes: [
        {
          id: 'node_1',
          type: 'trigger',
          position: { x: 300, y: 50 },
          data: {
            label: 'Trigger: Manual / Webhook Execution',
            description: 'Initiates automation sequence',
            agentType: 'planner',
            action: 'start_workflow',
            config: {},
          },
        },
        {
          id: 'node_2',
          type: 'ai',
          position: { x: 300, y: 200 },
          data: {
            label: 'AI Agent: Reasoning & Processing',
            description: `Processes requirements for: ${prompt}`,
            agentType: 'execution',
            action: 'ai_process',
            config: { prompt: `Execute automation logic for: ${prompt}` },
          },
        },
        {
          id: 'node_3',
          type: 'transform',
          position: { x: 300, y: 350 },
          data: {
            label: 'Validation Agent: Verify Schema',
            description: 'Validates structure and required fields',
            agentType: 'validation',
            action: 'validate_payload',
            config: {},
          },
        },
        {
          id: 'node_4',
          type: 'slack',
          position: { x: 150, y: 500 },
          data: {
            label: 'Slack: Operator Notification',
            description: 'Dispatches notification with results',
            agentType: 'execution',
            action: 'post_message',
            config: { channel: '#general', message: 'Automation finished successfully: {{result}}' },
          },
        },
        {
          id: 'node_5',
          type: 'google-sheets',
          position: { x: 450, y: 500 },
          data: {
            label: 'Google Sheets: Audit Log',
            description: 'Records output to tracking sheet',
            agentType: 'monitoring',
            action: 'append_row',
            config: {
              spreadsheetId: '1-Agentflow-General-Logs',
              range: 'Runs!A:D',
              rowData: ['{{timestamp}}', 'SUCCESS', '{{execution_id}}', '{{result}}'],
            },
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'node_1', target: 'node_2', animated: true },
        { id: 'e2', source: 'node_2', target: 'node_3', animated: true },
        { id: 'e3', source: 'node_3', target: 'node_4', animated: true },
        { id: 'e4', source: 'node_3', target: 'node_5', animated: true },
      ],
      version: 1,
      status: 'active',
    };
  }
}

module.exports = new AIService();
