const mongoose = require('mongoose');
const config = require('./env');

let mongoServer = null;

async function connectDB() {
  const isInMemoryRequested = config.USE_IN_MEMORY_DB === true || config.USE_IN_MEMORY_DB === 'true';

  if (!isInMemoryRequested && config.MONGODB_URI) {
    try {
      console.log(`[DB] Attempting connection to MongoDB at: ${config.MONGODB_URI}`);
      const conn = await mongoose.connect(config.MONGODB_URI, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
      return { type: 'mongodb', uri: config.MONGODB_URI };
    } catch (err) {
      console.warn(`[DB] Could not connect to local MongoDB (${err.message}). Using Built-in In-Memory Database engine.`);
    }
  }

  // Built-in In-Memory Database Mode
  console.log('[DB] Running with Agentflow Pure-JS In-Memory Database Engine');
  return { type: 'in-memory-engine', uri: 'memory://agentflow_ai' };
}

async function disconnectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    console.log('[DB] Disconnected from database');
  } catch (err) {
    console.error('[DB] Error during disconnect:', err.message);
  }
}

module.exports = {
  connectDB,
  disconnectDB,
};
