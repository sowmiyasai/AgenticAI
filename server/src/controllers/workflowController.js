const workflowService = require('../services/workflowService');
const aiService = require('../services/aiService');

class WorkflowController {
  async getDashboard(req, res, next) {
    try {
      const data = await workflowService.getDashboardMetrics(req.user.id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async listWorkflows(req, res, next) {
    try {
      const workflows = await workflowService.listWorkflows(req.user.id, req.query);
      res.status(200).json({
        success: true,
        count: workflows.length,
        data: workflows,
      });
    } catch (err) {
      next(err);
    }
  }

  async getWorkflow(req, res, next) {
    try {
      const workflow = await workflowService.getWorkflowById(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: workflow,
      });
    } catch (err) {
      next(err);
    }
  }

  async createWorkflow(req, res, next) {
    try {
      const workflow = await workflowService.createWorkflow(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Workflow created successfully',
        data: workflow,
      });
    } catch (err) {
      next(err);
    }
  }

  async generateWorkflow(req, res, next) {
    try {
      const { prompt } = req.body;
      const generated = await aiService.generateWorkflowFromPrompt(prompt);
      res.status(200).json({
        success: true,
        message: 'Workflow graph generated successfully',
        data: generated,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateWorkflow(req, res, next) {
    try {
      const updated = await workflowService.updateWorkflow(req.params.id, req.user.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Workflow updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async duplicateWorkflow(req, res, next) {
    try {
      const cloned = await workflowService.duplicateWorkflow(req.params.id, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Workflow duplicated successfully',
        data: cloned,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteWorkflow(req, res, next) {
    try {
      const result = await workflowService.deleteWorkflow(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Workflow deleted successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WorkflowController();
