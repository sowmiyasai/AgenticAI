const config = require('../config/env');
const orchestrator = require('../agents/orchestrator');

class InMemoryExecutionQueue {
  constructor() {
    this.jobs = [];
    this.isProcessing = false;
    console.log('[Queue] In-Memory Background Execution Queue Initialized');
  }

  async add(name, data, options = {}) {
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      data,
      options,
      status: 'waiting',
      createdAt: new Date(),
    };

    this.jobs.push(job);
    // Process asynchronously in background
    setTimeout(() => this.processNext(), options.delay || 10);
    return job;
  }

  async processNext() {
    if (this.isProcessing) return;
    const nextJob = this.jobs.find(j => j.status === 'waiting');
    if (!nextJob) return;

    this.isProcessing = true;
    nextJob.status = 'active';

    try {
      console.log(`[Queue: InMemory] Processing background job: ${nextJob.name} (${nextJob.id})`);
      await orchestrator.runWorkflow(nextJob.data);
      nextJob.status = 'completed';
    } catch (err) {
      console.error(`[Queue: InMemory] Job ${nextJob.id} failed:`, err);
      nextJob.status = 'failed';
      nextJob.error = err.message;
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }

  getJobCount() {
    return this.jobs.length;
  }
}

// Queue factory with Redis/BullMQ fallback
let executionQueue = null;

function getExecutionQueue() {
  if (executionQueue) return executionQueue;

  const useInMemory = config.USE_IN_MEMORY_REDIS || !config.REDIS_URL;

  if (!useInMemory) {
    try {
      const { Queue, Worker } = require('bullmq');
      const IORedis = require('ioredis');
      const connection = new IORedis(config.REDIS_URL, { maxRetriesPerRequest: null });

      const bullQueue = new Queue('workflow-executions', { connection });
      const worker = new Worker(
        'workflow-executions',
        async (job) => {
          console.log(`[Queue: BullMQ] Processing job ${job.id}`);
          return orchestrator.runWorkflow(job.data);
        },
        { connection }
      );

      worker.on('failed', (job, err) => {
        console.error(`[Queue: BullMQ] Job ${job.id} failed:`, err.message);
      });

      console.log('[Queue] BullMQ Queue initialized with Redis');
      executionQueue = bullQueue;
      return executionQueue;
    } catch (err) {
      console.warn(`[Queue] Failed to initialize BullMQ (${err.message}). Using In-Memory Queue fallback.`);
    }
  }

  executionQueue = new InMemoryExecutionQueue();
  return executionQueue;
}

module.exports = {
  getExecutionQueue,
  InMemoryExecutionQueue,
};
