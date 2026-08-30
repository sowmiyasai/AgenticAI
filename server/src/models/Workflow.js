const mongoose = require('mongoose');
const { getMemoryCollection } = require('./store');

const WorkflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workflow name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'active',
    },
    triggerConfig: {
      type: {
        type: String,
        default: 'manual',
      },
      config: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    nodes: {
      type: Array,
      default: [],
    },
    edges: {
      type: Array,
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const memoryStore = getMemoryCollection('workflows');
const WorkflowModel = mongoose.models.Workflow || mongoose.model('Workflow', WorkflowSchema);

const WorkflowProxy = {
  isMongooseReady() {
    return mongoose.connection.readyState === 1;
  },

  async create(data) {
    if (this.isMongooseReady()) {
      return WorkflowModel.create(data);
    }
    return memoryStore.create(data);
  },

  find(query) {
    if (this.isMongooseReady()) {
      return WorkflowModel.find(query);
    }
    return memoryStore.find(query);
  },

  findOne(query) {
    if (this.isMongooseReady()) {
      return WorkflowModel.findOne(query);
    }
    return memoryStore.findOne(query);
  },

  findById(id) {
    if (this.isMongooseReady()) {
      return WorkflowModel.findById(id);
    }
    return memoryStore.findById(id);
  },

  findByIdAndUpdate(id, update, options) {
    if (this.isMongooseReady()) {
      return WorkflowModel.findByIdAndUpdate(id, update, options);
    }
    return memoryStore.findByIdAndUpdate(id, update, options);
  },

  findByIdAndDelete(id) {
    if (this.isMongooseReady()) {
      return WorkflowModel.findByIdAndDelete(id);
    }
    return memoryStore.deleteOne({ _id: id });
  },

  deleteOne(query) {
    if (this.isMongooseReady()) {
      return WorkflowModel.deleteOne(query);
    }
    return memoryStore.deleteOne(query);
  },

  countDocuments(query) {
    if (this.isMongooseReady()) {
      return WorkflowModel.countDocuments(query);
    }
    return memoryStore.countDocuments(query);
  }
};

module.exports = WorkflowProxy;
module.exports.MongooseModel = WorkflowModel;
