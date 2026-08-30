const mongoose = require('mongoose');
const { getMemoryCollection } = require('./store');

const NotificationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: true,
      index: true,
    },
    workflowId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Workflow',
      default: null,
    },
    executionId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Execution',
      default: null,
    },
    type: {
      type: String,
      enum: ['success', 'failure', 'escalation', 'warning', 'info'],
      default: 'info',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const memoryStore = getMemoryCollection('notifications');
const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

const NotificationProxy = {
  isMongooseReady() {
    return mongoose.connection.readyState === 1;
  },

  async create(data) {
    if (this.isMongooseReady()) {
      return NotificationModel.create(data);
    }
    return memoryStore.create(data);
  },

  find(query) {
    if (this.isMongooseReady()) {
      return NotificationModel.find(query);
    }
    return memoryStore.find(query);
  },

  findByIdAndUpdate(id, update, options) {
    if (this.isMongooseReady()) {
      return NotificationModel.findByIdAndUpdate(id, update, options);
    }
    return memoryStore.findByIdAndUpdate(id, update, options);
  },

  updateMany(query, update) {
    if (this.isMongooseReady()) {
      return NotificationModel.updateMany(query, update);
    }
    return memoryStore.updateMany ? memoryStore.updateMany(query, update) : Promise.resolve();
  },

  countDocuments(query) {
    if (this.isMongooseReady()) {
      return NotificationModel.countDocuments(query);
    }
    return memoryStore.countDocuments(query);
  }
};

module.exports = NotificationProxy;
module.exports.MongooseModel = NotificationModel;
