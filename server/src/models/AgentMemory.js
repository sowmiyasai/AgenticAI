const mongoose = require('mongoose');
const { getMemoryCollection } = require('./store');

const AgentMemorySchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Workflow',
      required: true,
      index: true,
    },
    executionId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Execution',
      required: true,
      index: true,
    },
    agentId: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    confidenceScore: {
      type: Number,
      default: 1.0,
    },
  },
  {
    timestamps: true,
  }
);

const memoryStore = getMemoryCollection('agentmemories');
const AgentMemoryModel = mongoose.models.AgentMemory || mongoose.model('AgentMemory', AgentMemorySchema);

const AgentMemoryProxy = {
  isMongooseReady() {
    return mongoose.connection.readyState === 1;
  },

  async create(data) {
    if (this.isMongooseReady()) {
      return AgentMemoryModel.create(data);
    }
    return memoryStore.create(data);
  },

  find(query) {
    if (this.isMongooseReady()) {
      return AgentMemoryModel.find(query);
    }
    return memoryStore.find(query);
  },

  findOne(query) {
    if (this.isMongooseReady()) {
      return AgentMemoryModel.findOne(query);
    }
    return memoryStore.findOne(query);
  }
};

module.exports = AgentMemoryProxy;
module.exports.MongooseModel = AgentMemoryModel;
