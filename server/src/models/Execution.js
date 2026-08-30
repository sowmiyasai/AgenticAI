const mongoose = require('mongoose');
const { getMemoryCollection } = require('./store');

const ExecutionSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Workflow',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: true,
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING',
    },
    currentNode: {
      type: String,
      default: null,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    inputs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    outputs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    error: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    langGraph: {
      type: String,
      enum: ['available', 'not-installed'],
      default: 'available',
    },
  },
  {
    timestamps: true,
  }
);

const memoryStore = getMemoryCollection('executions');
const ExecutionModel = mongoose.models.Execution || mongoose.model('Execution', ExecutionSchema);

const ExecutionProxy = {
  isMongooseReady() {
    return mongoose.connection.readyState === 1;
  },

  async create(data) {
    if (this.isMongooseReady()) {
      return ExecutionModel.create(data);
    }
    return memoryStore.create(data);
  },

  find(query) {
    if (this.isMongooseReady()) {
      return ExecutionModel.find(query);
    }
    return memoryStore.find(query);
  },

  findOne(query) {
    if (this.isMongooseReady()) {
      return ExecutionModel.findOne(query);
    }
    return memoryStore.findOne(query);
  },

  findById(id) {
    if (this.isMongooseReady()) {
      return ExecutionModel.findById(id);
    }
    return memoryStore.findById(id);
  },

  findByIdAndUpdate(id, update, options) {
    if (this.isMongooseReady()) {
      return ExecutionModel.findByIdAndUpdate(id, update, options);
    }
    return memoryStore.findByIdAndUpdate(id, update, options);
  },

  deleteOne(query) {
    if (this.isMongooseReady()) {
      return ExecutionModel.deleteOne(query);
    }
    return memoryStore.deleteOne(query);
  },

  countDocuments(query) {
    if (this.isMongooseReady()) {
      return ExecutionModel.countDocuments(query);
    }
    return memoryStore.countDocuments(query);
  }
};

module.exports = ExecutionProxy;
module.exports.MongooseModel = ExecutionModel;
