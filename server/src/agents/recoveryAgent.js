const monitoringAgent = require('./monitoringAgent');
const notificationService = require('../services/notificationService');

class RecoveryAgent {
  constructor() {
    this.name = 'Recovery Agent';
    this.maxRetries = 3;
  }

  /**
   * Classify failure reason into one of standard taxonomy
   */
  classifyError(error) {
    const msg = (error && (error.message || error.code || String(error))).toLowerCase();

    if (error && error.code) {
      if (['MISSING_FIELDS', 'API_FAILURE', 'AUTH_EXPIRED', 'RATE_LIMIT', 'TRANSIENT'].includes(error.code)) {
        return error.code;
      }
    }

    if (msg.includes('auth') || msg.includes('unauthorized') || msg.includes('token') || msg.includes('expired') || msg.includes('401') || msg.includes('403')) {
      return 'AUTH_EXPIRED';
    }
    if (msg.includes('rate limit') || msg.includes('429') || msg.includes('quota') || msg.includes('too many requests')) {
      return 'RATE_LIMIT';
    }
    if (msg.includes('missing') || msg.includes('required') || msg.includes('validation')) {
      return 'MISSING_FIELDS';
    }
    if (msg.includes('timeout') || msg.includes('econnreset') || msg.includes('econnrefused') || msg.includes('503') || msg.includes('502') || msg.includes('504')) {
      return 'TRANSIENT';
    }

    return 'API_FAILURE';
  }

  /**
   * Handle failure: decide whether to retry with exponential backoff or escalate
   */
  async handleFailure({ executionId, workflowId, nodeId, error, currentRetryCount = 0, owner }) {
    const errorType = this.classifyError(error);
    const isRetryable = (errorType === 'TRANSIENT' || errorType === 'RATE_LIMIT') && currentRetryCount < this.maxRetries;

    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      nodeId,
      agent: 'recovery',
      level: 'warning',
      message: `Error classified as [${errorType}]: ${error.message || 'Execution fault detected'}`,
      metadata: { errorType, currentRetryCount, maxRetries: this.maxRetries },
    });

    if (isRetryable) {
      // Exponential backoff: base 1000ms * 2^retries
      const backoffMs = Math.min(1000 * Math.pow(2, currentRetryCount), 10000);

      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        nodeId,
        agent: 'recovery',
        level: 'info',
        message: `Scheduling automatic retry #${currentRetryCount + 1} with exponential backoff (${backoffMs}ms delay)...`,
        metadata: { retryCount: currentRetryCount + 1, backoffMs, strategy: 'retry_with_backoff' },
      });

      return {
        strategy: 'retry_with_backoff',
        errorType,
        backoffMs,
        nextRetryCount: currentRetryCount + 1,
      };
    }

    // Escalate to Operator
    const escalationReason = errorType === 'AUTH_EXPIRED'
      ? 'OAuth token expired or missing. Please re-authenticate integration credentials in settings.'
      : errorType === 'MISSING_FIELDS'
      ? 'Required workflow data fields are missing from step payload.'
      : `Step failed permanently after ${currentRetryCount} attempts. Operator intervention required.`;

    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      nodeId,
      agent: 'recovery',
      level: 'error',
      message: `ESCALATING TO OPERATOR: ${escalationReason}`,
      metadata: { strategy: 'escalate', errorType, details: error.message || error },
      status: 'FAILED',
    });

    // Create persistent operator notification
    if (owner) {
      await notificationService.createNotification({
        owner,
        workflowId,
        executionId,
        type: 'escalation',
        title: `Workflow Escalation: [${errorType}]`,
        message: `Execution failed at step "${nodeId}": ${escalationReason}`,
      });
    }

    return {
      strategy: 'escalate',
      errorType,
      reason: escalationReason,
    };
  }
}

module.exports = new RecoveryAgent();
