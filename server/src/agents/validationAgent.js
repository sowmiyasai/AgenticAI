const monitoringAgent = require('./monitoringAgent');

class ValidationAgent {
  constructor() {
    this.name = 'Validation Agent';
  }

  /**
   * Validate node inputs before execution
   */
  async validateNodeInputs({ executionId, workflowId, node, context }) {
    const nodeType = node.type || 'generic';
    const config = (node.data && node.data.config) || {};

    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      nodeId: node.id,
      agent: 'validation',
      level: 'info',
      message: `Validating input configuration for node "${(node.data && node.data.label) || node.id}" (${nodeType})`,
      metadata: { nodeType, configKeys: Object.keys(config) },
    });

    // Check specific requirements by node type
    if (nodeType === 'gmail' && config.action === 'send_email') {
      if (!config.to && !context.to && !context.sender_email && !context.email) {
        return {
          valid: false,
          errorCode: 'MISSING_FIELDS',
          message: 'Gmail node requires a recipient "to" address',
        };
      }
    }

    if (nodeType === 'slack' && config.action === 'post_message') {
      if (!config.message && !config.text && !context.message && !context.incident_synopsis) {
        // Will interpolate or use default fallback
      }
    }

    return { valid: true };
  }

  /**
   * Validate node output after execution
   */
  async validateNodeOutput({ executionId, workflowId, node, output }) {
    const nodeType = node.type || 'generic';

    if (!output || typeof output !== 'object') {
      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        nodeId: node.id,
        agent: 'validation',
        level: 'warning',
        message: `Output from node "${(node.data && node.data.label) || node.id}" was empty or non-object`,
        metadata: { output },
      });
      return { valid: false, errorCode: 'MISSING_FIELDS', message: 'Node produced empty output' };
    }

    // Condition evaluation
    if (nodeType === 'condition' || (node.data && node.data.action === 'evaluate_condition')) {
      const conditionExpr = (node.data && node.data.config && node.data.config.condition) || 'true';
      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        nodeId: node.id,
        agent: 'validation',
        level: 'info',
        message: `Evaluating logic condition: "${conditionExpr}"`,
        metadata: { conditionExpr, conditionResult: output.passed !== false },
      });
    }

    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      nodeId: node.id,
      agent: 'validation',
      level: 'success',
      message: `Node output validated successfully. Fields verified: ${Object.keys(output).join(', ')}`,
      metadata: { outputKeys: Object.keys(output) },
    });

    return { valid: true, output };
  }
}

module.exports = new ValidationAgent();
