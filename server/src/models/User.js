const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getMemoryCollection } = require('./store');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'operator'],
      default: 'operator',
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Memory fallback model wrapper
const memoryStore = getMemoryCollection('users');

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

// Hybrid model proxy that delegates to Mongoose or MemoryStore
const UserProxy = {
  isMongooseReady() {
    return mongoose.connection.readyState === 1;
  },

  async create(data) {
    if (this.isMongooseReady()) {
      return UserModel.create(data);
    }
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const userDoc = Object.assign({}, data, {
      password: hashedPassword,
      role: data.role || 'operator',
    });
    const created = await memoryStore.create(userDoc);
    created.comparePassword = async function(cand) {
      return bcrypt.compare(cand, created.password);
    };
    return created;
  },

  findOne(query) {
    if (this.isMongooseReady()) {
      return UserModel.findOne(query);
    }
    return {
      select(fields) {
        return {
          async exec() {
            const doc = await memoryStore.findOne(query);
            if (doc) {
              doc.comparePassword = async function(cand) {
                return bcrypt.compare(cand, doc.password);
              };
            }
            return doc;
          },
          then(resolve, reject) {
            return this.exec().then(resolve, reject);
          }
        };
      },
      async exec() {
        const doc = await memoryStore.findOne(query);
        if (doc) {
          doc.comparePassword = async function(cand) {
            return bcrypt.compare(cand, doc.password);
          };
        }
        return doc;
      },
      then(resolve, reject) {
        return this.exec().then(resolve, reject);
      }
    };
  },

  findById(id) {
    if (this.isMongooseReady()) {
      return UserModel.findById(id);
    }
    return {
      select(fields) {
        return {
          async exec() {
            return memoryStore.findById(id);
          },
          then(resolve, reject) {
            return this.exec().then(resolve, reject);
          }
        };
      },
      async exec() {
        return memoryStore.findById(id);
      },
      then(resolve, reject) {
        return this.exec().then(resolve, reject);
      }
    };
  },

  find(query) {
    if (this.isMongooseReady()) {
      return UserModel.find(query);
    }
    return memoryStore.find(query);
  },

  findByIdAndUpdate(id, update, options) {
    if (this.isMongooseReady()) {
      return UserModel.findByIdAndUpdate(id, update, options);
    }
    return memoryStore.findByIdAndUpdate(id, update, options);
  },

  countDocuments(query) {
    if (this.isMongooseReady()) {
      return UserModel.countDocuments(query);
    }
    return memoryStore.countDocuments(query);
  }
};

module.exports = UserProxy;
module.exports.MongooseModel = UserModel;
