const express = require('express');
const { body } = require('express-validator');
const workflowController = require('../controllers/workflowController');
const executionController = require('../controllers/executionController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All workflow endpoints require authentication
router.use(authenticateToken);

router.get('/dashboard', workflowController.getDashboard);

router.get('/', workflowController.listWorkflows);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Workflow name is required'),
  ],
  validate,
  workflowController.createWorkflow
);

router.post(
  '/generate',
  [
    body('prompt').trim().notEmpty().withMessage('Prompt is required for workflow generation'),
  ],
  validate,
  workflowController.generateWorkflow
);

router.get('/:id', workflowController.getWorkflow);

router.put('/:id', workflowController.updateWorkflow);

router.post('/:id/duplicate', workflowController.duplicateWorkflow);

router.post('/:id/execute', executionController.triggerExecution);

router.delete('/:id', workflowController.deleteWorkflow);

module.exports = router;
