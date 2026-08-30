const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Workflow = require('../models/Workflow');
const orchestrator = require('../agents/orchestrator');
const { getExecutionQueue } = require('../queues/executionQueue');

class ExecutionService {
  async triggerWorkflow(workflowId, userId, inputs = {}) {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }

    // Take immutable snapshot
    const snapshot = {
      id: workflow._id || workflow.id,
      name: workflow.name,
      description: workflow.description,
      version: workflow.version,
      triggerConfig: workflow.triggerConfig,
      nodes: workflow.nodes,
      edges: workflow.edges,
    };

    // Create execution record in PENDING state
    const execution = await Execution.create({
      workflowId: workflow._id || workflow.id,
      owner: userId,
      snapshot,
      status: 'PENDING',
      currentNode: null,
      startTime: new Date(),
      inputs,
      outputs: {},
      retryCount: 0,
    });

    const executionId = execution._id || execution.id;

    // Dispatch to background queue or orchestrator
    const queue = getExecutionQueue();
    await queue.add('run-workflow', {
      executionId,
      workflowId: workflow._id || workflow.id,
      workflowSnapshot: snapshot,
      initialInputs: inputs,
      owner: userId,
    });

    return execution;
  }

  async listExecutions(userId, query = {}) {
    const filter = { owner: userId };
    if (query.workflowId) filter.workflowId = query.workflowId;
    if (query.status) filter.status = query.status;

    const executions = await Execution.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(query.limit || '50', 10));

    return executions;
  }

  async getExecutionById(executionId, userId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      const err = new Error('Execution not found');
      err.statusCode = 404;
      throw err;
    }
    return execution;
  }

  async getExecutionTimeline(executionId, userId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      const err = new Error('Execution not found');
      err.statusCode = 404;
      throw err;
    }

    const logs = await ExecutionLog.find({ executionId }).sort({ timestamp: 1 });
    return {
      execution,
      logs,
    };
  }

  async pauseExecution(executionId, userId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      const err = new Error('Execution not found');
      err.statusCode = 404;
      throw err;
    }

    if (execution.status !== 'RUNNING' && execution.status !== 'PENDING') {
      const err = new Error(`Cannot pause execution in "${execution.status}" status`);
      err.statusCode = 400;
      throw err;
    }

    orchestrator.pauseExecution(executionId);
    const updated = await Execution.findByIdAndUpdate(executionId, { status: 'PAUSED' }, { new: true });
    return updated;
  }

  async resumeExecution(executionId, userId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      const err = new Error('Execution not found');
      err.statusCode = 404;
      throw err;
    }

    if (execution.status !== 'PAUSED') {
      const err = new Error(`Cannot resume execution in "${execution.status}" status`);
      err.statusCode = 400;
      throw err;
    }

    await Execution.findByIdAndUpdate(executionId, { status: 'RUNNING' });

    // Resume running from snapshot
    const queue = getExecutionQueue();
    await queue.add('resume-workflow', {
      executionId: execution._id || execution.id,
      workflowId: execution.workflowId,
      workflowSnapshot: execution.snapshot,
      initialInputs: execution.inputs || {},
      owner: userId,
    });

    return Execution.findById(executionId);
  }

  async cancelExecution(executionId, userId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      const err = new Error('Execution not found');
      err.statusCode = 404;
      throw err;
    }

    orchestrator.cancelExecution(executionId);
    const updated = await Execution.findByIdAndUpdate(
      executionId,
      {
        status: 'CANCELLED',
        endTime: new Date(),
        error: { message: 'Execution cancelled by operator' },
      },
      { new: true }
    );

    return updated;
  }
}

module.exports = new ExecutionService();
