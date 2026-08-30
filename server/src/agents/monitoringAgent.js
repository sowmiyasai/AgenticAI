const ExecutionLog = require('../models/ExecutionLog');
const { emitExecutionEvent } = require('../config/socket');

class MonitoringAgent {
  constructor() {
    this.name = 'Monitoring Agent';
  }

  /**
   * Record a granular log event and broadcast in real-time
   */
  async logEvent({ executionId, workflowId, nodeId, agent, level, message, metadata = {}, status }) {
    const timestamp = new Date();
    
    // 1. Persist to MongoDB / MemoryStore
    const logDoc = await ExecutionLog.create({
      executionId,
      workflowId,
      nodeId: nodeId || null,
      agent: agent || 'monitoring',
      level: level || 'info',
      message,
      metadata,
      timestamp,
    });

    // 2. Broadcast via Socket.IO to live execution timeline
    emitExecutionEvent(executionId, {
      id: logDoc._id || logDoc.id,
      executionId,
      workflowId,
      nodeId,
      agent,
      level,
      message,
      metadata,
      status: status || 'RUNNING',
      timestamp: timestamp.toISOString(),
    });

    console.log(`[Agent: ${agent.toUpperCase()}] [${level.toUpperCase()}] ${message}`);
    return logDoc;
  }
}

module.exports = new MonitoringAgent();
