const monitoringAgent = require('./monitoringAgent');
const AgentMemory = require('../models/AgentMemory');

class PlannerAgent {
  constructor() {
    this.name = 'Planner Agent';
  }

  /**
   * Evaluates graph topology, ordering, and confidence score
   */
  async planExecution({ executionId, workflowId, workflowSnapshot }) {
    const nodes = workflowSnapshot.nodes || [];
    const edges = workflowSnapshot.edges || [];

    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      agent: 'planner',
      level: 'info',
      message: `Analyzing graph structure: ${nodes.length} nodes, ${edges.length} connections`,
      metadata: { nodeCount: nodes.length, edgeCount: edges.length },
    });

    if (nodes.length === 0) {
      throw new Error('Graph analysis failed: Workflow contains no nodes');
    }

    // Build Adjacency List & In-Degree map for topological sorting
    const inDegree = new Map();
    const adjList = new Map();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    }

    for (const edge of edges) {
      if (inDegree.has(edge.target)) {
        inDegree.set(edge.target, inDegree.get(edge.target) + 1);
      }
      if (adjList.has(edge.source)) {
        adjList.get(edge.source).push(edge.target);
      }
    }

    // Kahn's Algorithm for Topological Sort
    const queue = [];
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    const executionPlan = [];
    while (queue.length > 0) {
      const currentId = queue.shift();
      const nodeObj = nodes.find(function(n) { return n.id === currentId; });
      if (nodeObj) {
        executionPlan.push(nodeObj);
      }

      const neighbors = adjList.get(currentId) || [];
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Cycle detection check
    const hasCycle = executionPlan.length !== nodes.length;
    let confidenceScore = hasCycle ? 0.45 : 0.98;

    if (hasCycle) {
      // If disconnected or cyclic, fallback to original node list order
      await monitoringAgent.logEvent({
        executionId,
        workflowId,
        agent: 'planner',
        level: 'warning',
        message: 'Cyclic or disconnected dependencies detected. Applying topological fallback order.',
        metadata: { sortedCount: executionPlan.length, totalNodes: nodes.length },
      });
      // Append remaining nodes
      const plannedIds = new Set(executionPlan.map(function(n) { return n.id; }));
      for (const n of nodes) {
        if (!plannedIds.has(n.id)) executionPlan.push(n);
      }
    }

    // Save planner plan in AgentMemory
    await AgentMemory.create({
      workflowId,
      executionId,
      agentId: 'planner',
      key: 'execution_plan',
      value: {
        planOrder: executionPlan.map(function(n) { return n.id; }),
        confidenceScore,
      },
      confidenceScore,
    });

    await monitoringAgent.logEvent({
      executionId,
      workflowId,
      agent: 'planner',
      level: 'success',
      message: `Execution plan established (${executionPlan.length} steps). Planner confidence: ${(confidenceScore * 100).toFixed(0)}%`,
      metadata: {
        confidenceScore,
        stepNames: executionPlan.map(function(n) { return (n.data && n.data.label) || n.id; }),
      },
    });

    return {
      executionPlan,
      confidenceScore,
    };
  }
}

module.exports = new PlannerAgent();
