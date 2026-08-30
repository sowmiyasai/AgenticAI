const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');

class WorkflowService {
  async getDashboardMetrics(userId) {
    const totalWorkflows = await Workflow.countDocuments({ owner: userId });
    const activeWorkflows = await Workflow.countDocuments({ owner: userId, status: 'active' });
    const totalExecutions = await Execution.countDocuments({ owner: userId });
    const completedExecutions = await Execution.countDocuments({ owner: userId, status: 'COMPLETED' });
    const failedExecutions = await Execution.countDocuments({ owner: userId, status: 'FAILED' });
    const runningExecutions = await Execution.countDocuments({ owner: userId, status: { $in: ['RUNNING', 'PENDING', 'RETRYING'] } });

    const successRate = totalExecutions > 0 ? ((completedExecutions / totalExecutions) * 100).toFixed(1) : '100.0';

    const recentExecutions = await Execution.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentLogs = await ExecutionLog.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      metrics: {
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        completedExecutions,
        failedExecutions,
        runningExecutions,
        successRate: parseFloat(successRate),
      },
      recentExecutions,
      recentLogs,
    };
  }

  async listWorkflows(userId, query = {}) {
    const filter = { owner: userId };
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }

    const workflows = await Workflow.find(filter).sort({ updatedAt: -1 });
    return workflows;
  }

  async getWorkflowById(id, userId) {
    const workflow = await Workflow.findById(id);
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }
    return workflow;
  }

  async createWorkflow(userId, data) {
    return Workflow.create({
      name: data.name || 'Untitled Automation',
      description: data.description || '',
      owner: userId,
      status: data.status || 'active',
      triggerConfig: data.triggerConfig || { type: 'manual', config: {} },
      nodes: data.nodes || [],
      edges: data.edges || [],
      version: 1,
      tags: data.tags || [],
    });
  }

  async updateWorkflow(id, userId, data) {
    const existing = await Workflow.findById(id);
    if (!existing) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }

    const currentVersion = existing.version || 1;
    const updateData = Object.assign({}, data, {
      version: currentVersion + 1,
      updatedAt: new Date(),
    });

    const updated = await Workflow.findByIdAndUpdate(id, updateData, { new: true });
    return updated;
  }

  async duplicateWorkflow(id, userId) {
    const original = await Workflow.findById(id);
    if (!original) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }

    const cloned = await Workflow.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      owner: userId,
      status: 'draft',
      triggerConfig: original.triggerConfig,
      nodes: original.nodes,
      edges: original.edges,
      version: 1,
      tags: original.tags,
    });

    return cloned;
  }

  async deleteWorkflow(id, userId) {
    const existing = await Workflow.findById(id);
    if (!existing) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }

    await Workflow.findByIdAndDelete(id);
    return { success: true, deletedId: id };
  }
}

module.exports = new WorkflowService();
