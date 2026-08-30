const mongoose = require('mongoose');
const { getMemoryCollection } = require('./store');

const ExecutionLogSchema = new mongoose.Schema(
  {
    executionId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Execution',
      required: true,
      index: true,
    },
    workflowId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Workflow',
      required: true,
    },
    nodeId: {
      type: String,
      default: null,
    },
    agent: {
      type: String,
      enum: ['planner', 'execution', 'validation', 'recovery', 'monitoring'],
      required: true,
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const memoryStore = getMemoryCollection('executionlogs');
const ExecutionLogModel = mongoose.models.ExecutionLog || mongoose.model('ExecutionLog', ExecutionLogSchema);

const ExecutionLogProxy = {
  isMongooseReady() {
    return mongoose.connection.readyState === 1;
  },

  async create(data) {
    if (this.isMongooseReady()) {
      return ExecutionLogModel.create(data);
    }
    return memoryStore.create(data);
  },

  find(query) {
    if (this.isMongooseReady()) {
      return ExecutionLogModel.find(query);
    }
    return memoryStore.find(query);
  },

  countDocuments(query) {
    if (this.isMongooseReady()) {
      return ExecutionLogModel.countDocuments(query);
    }
    return memoryStore.countDocuments(query);
  }
};

module.exports = ExecutionLogProxy;
module.exports.MongooseModel = ExecutionLogModel;
