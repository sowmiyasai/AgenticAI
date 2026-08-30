const executionService = require('../services/executionService');

class ExecutionController {
  async triggerExecution(req, res, next) {
    try {
      const { id: workflowId } = req.params;
      const { inputs } = req.body;
      const execution = await executionService.triggerWorkflow(workflowId, req.user.id, inputs || {});
      res.status(202).json({
        success: true,
        message: 'Workflow execution queued successfully',
        data: execution,
      });
    } catch (err) {
      next(err);
    }
  }

  async listExecutions(req, res, next) {
    try {
      const executions = await executionService.listExecutions(req.user.id, req.query);
      res.status(200).json({
        success: true,
        count: executions.length,
        data: executions,
      });
    } catch (err) {
      next(err);
    }
  }

  async getExecution(req, res, next) {
    try {
      const execution = await executionService.getExecutionById(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: execution,
      });
    } catch (err) {
      next(err);
    }
  }

  async getExecutionTimeline(req, res, next) {
    try {
      const timeline = await executionService.getExecutionTimeline(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (err) {
      next(err);
    }
  }

  async pauseExecution(req, res, next) {
    try {
      const paused = await executionService.pauseExecution(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Execution paused',
        data: paused,
      });
    } catch (err) {
      next(err);
    }
  }

  async resumeExecution(req, res, next) {
    try {
      const resumed = await executionService.resumeExecution(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Execution resumed',
        data: resumed,
      });
    } catch (err) {
      next(err);
    }
  }

  async cancelExecution(req, res, next) {
    try {
      const cancelled = await executionService.cancelExecution(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Execution cancelled',
        data: cancelled,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExecutionController();
