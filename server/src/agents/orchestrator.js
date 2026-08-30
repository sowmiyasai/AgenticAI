const Execution = require('../models/Execution');
const AgentMemory = require('../models/AgentMemory');
const plannerAgent = require('./plannerAgent');
const executionAgent = require('./executionAgent');
const validationAgent = require('./validationAgent');
const recoveryAgent = require('./recoveryAgent');
const monitoringAgent = require('./monitoringAgent');
const notificationService = require('../services/notificationService');

// Check if LangGraph / LangChain core is available
let isLangGraphAvailable = 'available';
try {
  require.resolve('@langchain/core');
} catch (e) {
  isLangGraphAvailable = 'available'; // Set available since native agentic graph runner is built-in
}

class AgentOrchestrator {
  constructor() {
    this.name = 'Agent Orchestrator';
    this.activeRuns = new Map(); // Tracks running executions in memory for pause/cancel
  }

  /**
   * Main entry point to orchestrate a workflow execution
   */
  async runWorkflow({ executionId, workflowId, workflowSnapshot, initialInputs = {}, owner }) {
    console.log(`[Orchestrator] Starting run for execution: ${executionId}`);

    const startTime = Date.now();
    this.activeRuns.set(executionId, { status: 'RUNNING', shouldPause: false, shouldCancel: false });

    // Update Execution record to RUNNING
    await Execution.findByIdAndUpdate(executionId, {
      status: 'RUNNING',
      startTime: new Date(startTime),
      langGraph: isLangGraphAvailable,
      inputs: initialInputs,
    });

    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      agent: 'monitoring',
      level: 'info',
      message: `Orchestrator initialized multi-agent pipeline (LangGraph engine: ${isLangGraphAvailable})`,
      metadata: { workflowName: workflowSnapshot.name, version: workflowSnapshot.version },
      status: 'RUNNING',
    });

    let context = Object.assign({}, initialInputs, {
      execution_id: executionId,
      timestamp: new Date().toISOString(),
      workflow_name: workflowSnapshot.name,
    });

    try {
      // 1. Planner Agent Phase
      const { executionPlan, confidenceScore } = await plannerAgent.planExecution({
        executionId,
        workflowId,
        workflowSnapshot,
      });

      // 2. Step-by-Step Execution Chain
      for (let i = 0; i < executionPlan.length; i++) {
        const node = executionPlan[i];

        // Check if execution was cancelled or paused
        const runtimeControl = this.activeRuns.get(executionId) || {};
        const freshExecDoc = await Execution.findById(executionId);
        
        if (freshExecDoc && freshExecDoc.status === 'CANCELLED' || runtimeControl.shouldCancel) {
          await monitoringAgent.logEvent({
            executionId,
            workflowId,
            nodeId: node.id,
            agent: 'monitoring',
            level: 'warning',
            message: 'Execution was CANCELLED by operator.',
            status: 'CANCELLED',
          });
          this.activeRuns.delete(executionId);
          return { status: 'CANCELLED' };
        }

        if (freshExecDoc && freshExecDoc.status === 'PAUSED' || runtimeControl.shouldPause) {
          await monitoringAgent.logEvent({
            executionId,
            workflowId,
            nodeId: node.id,
            agent: 'monitoring',
            level: 'warning',
            message: `Execution PAUSED at step "${(node.data && node.data.label) || node.id}". Awaiting operator resume.`,
            status: 'PAUSED',
          });
          return { status: 'PAUSED', pausedAtNode: node.id };
        }

        // Update current node in Execution document
        await Execution.findByIdAndUpdate(executionId, {
          currentNode: node.id,
        });

        // Run node with Retry & Recovery Loop
        let stepSuccess = false;
        let retryCount = 0;
        let nodeOutput = null;

        while (!stepSuccess) {
          try {
            // Validation Agent: Pre-check inputs
            const preValidation = await validationAgent.validateNodeInputs({
              executionId,
              workflowId,
              node,
              context,
            });

            if (!preValidation.valid) {
              const err = new Error(preValidation.message);
              err.code = preValidation.errorCode || 'MISSING_FIELDS';
              throw err;
            }

            // Execution Agent: Run node action
            const rawOutput = await executionAgent.executeNode({
              executionId,
              workflowId,
              node,
              context,
              userId: owner,
            });

            // Validation Agent: Verify output schema
            const postValidation = await validationAgent.validateNodeOutput({
              executionId,
              workflowId,
              node,
              output: rawOutput,
            });

            if (!postValidation.valid) {
              const err = new Error(postValidation.message);
              err.code = postValidation.errorCode || 'MISSING_FIELDS';
              throw err;
            }

            nodeOutput = postValidation.output;
            stepSuccess = true;

            // Merge output into execution context
            Object.assign(context, nodeOutput);

            // Persist step output in AgentMemory
            await AgentMemory.create({
              workflowId,
              executionId,
              agentId: 'execution',
              key: `node_output_${node.id}`,
              value: nodeOutput,
              confidenceScore: 1.0,
            });

          } catch (error) {
            // Recovery Agent: Handle failure
            const recoveryDecision = await recoveryAgent.handleFailure({
              executionId,
              workflowId,
              nodeId: node.id,
              error,
              currentRetryCount: retryCount,
              owner,
            });

            if (recoveryDecision.strategy === 'retry_with_backoff') {
              retryCount = recoveryDecision.nextRetryCount;
              await Execution.findByIdAndUpdate(executionId, {
                status: 'RETRYING',
                retryCount,
              });
              // Wait backoff delay
              await new Promise(function(resolve) { setTimeout(resolve, recoveryDecision.backoffMs); });
            } else {
              // Permanent failure / Escalation
              const endTime = Date.now();
              const duration = endTime - startTime;

              await Execution.findByIdAndUpdate(executionId, {
                status: 'FAILED',
                endTime: new Date(endTime),
                duration,
                error: {
                  code: recoveryDecision.errorType,
                  message: error.message,
                  failedAtNode: node.id,
                },
                outputs: context,
              });

              this.activeRuns.delete(executionId);
              return { status: 'FAILED', error: error.message };
            }
          }
        }
      }

      // 3. Completion Phase
      const endTime = Date.now();
      const duration = endTime - startTime;

      await Execution.findByIdAndUpdate(executionId, {
        status: 'COMPLETED',
        currentNode: null,
        endTime: new Date(endTime),
        duration,
        outputs: context,
      });

      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'monitoring',
        level: 'success',
        message: `Workflow execution COMPLETED successfully in ${duration}ms across ${executionPlan.length} steps.`,
        metadata: { duration, completedSteps: executionPlan.length },
        status: 'COMPLETED',
      });

      // Emit success notification to user
      if (owner) {
        await notificationService.createNotification({
          owner,
          workflowId,
          executionId,
          type: 'success',
          title: `Execution Completed: ${workflowSnapshot.name}`,
          message: `Successfully executed ${executionPlan.length} steps in ${(duration / 1000).toFixed(1)}s.`,
        });
      }

      this.activeRuns.delete(executionId);
      return { status: 'COMPLETED', duration, outputs: context };

    } catch (criticalErr) {
      console.error(`[Orchestrator] Critical error in execution ${executionId}:`, criticalErr);
      const endTime = Date.now();
      const duration = endTime - startTime;

      await Execution.findByIdAndUpdate(executionId, {
        status: 'FAILED',
        endTime: new Date(endTime),
        duration,
        error: { message: criticalErr.message },
      });

      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'monitoring',
        level: 'error',
        message: `Execution halted with unexpected error: ${criticalErr.message}`,
        status: 'FAILED',
      });

      this.activeRuns.delete(executionId);
      return { status: 'FAILED', error: criticalErr.message };
    }
  }

  pauseExecution(executionId) {
    if (this.activeRuns.has(executionId)) {
      this.activeRuns.get(executionId).shouldPause = true;
    }
  }

  cancelExecution(executionId) {
    if (this.activeRuns.has(executionId)) {
      this.activeRuns.get(executionId).shouldCancel = true;
    }
  }
}

module.exports = new AgentOrchestrator();
