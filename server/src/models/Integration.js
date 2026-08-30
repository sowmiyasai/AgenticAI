const mongoose = require('mongoose');
const { getMemoryCollection } = require('./store');

const IntegrationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: true,
    },
    provider: {
      type: String,
      enum: ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'],
      required: true,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    accountEmail: {
      type: String,
      default: '',
    },
    accountName: {
      type: String,
      default: '',
    },
    scopes: {
      type: [String],
      default: [],
    },
    encryptedTokens: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    lastSync: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const memoryStore = getMemoryCollection('integrations');
const IntegrationModel = mongoose.models.Integration || mongoose.model('Integration', IntegrationSchema);

const IntegrationProxy = {
  isMongooseReady() {
    return mongoose.connection.readyState === 1;
  },

  async create(data) {
    if (this.isMongooseReady()) {
      return IntegrationModel.create(data);
    }
    return memoryStore.create(data);
  },

  find(query) {
    if (this.isMongooseReady()) {
      return IntegrationModel.find(query);
    }
    return memoryStore.find(query);
  },

  findOne(query) {
    if (this.isMongooseReady()) {
      return IntegrationModel.findOne(query);
    }
    return memoryStore.findOne(query);
  },

  findById(id) {
    if (this.isMongooseReady()) {
      return IntegrationModel.findById(id);
    }
    return memoryStore.findById(id);
  },

  findByIdAndUpdate(id, update, options) {
    if (this.isMongooseReady()) {
      return IntegrationModel.findByIdAndUpdate(id, update, options);
    }
    return memoryStore.findByIdAndUpdate(id, update, options);
  },

  updateOne(query, update) {
    if (this.isMongooseReady()) {
      return IntegrationModel.updateOne(query, update);
    }
    return memoryStore.updateOne(query, update);
  },

  deleteOne(query) {
    if (this.isMongooseReady()) {
      return IntegrationModel.deleteOne(query);
    }
    return memoryStore.deleteOne(query);
  }
};

module.exports = IntegrationProxy;
module.exports.MongooseModel = IntegrationModel;
