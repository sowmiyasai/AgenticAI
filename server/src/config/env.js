const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root or server directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || 'agentflow_super_secret_jwt_key_2026_change_in_prod',
  CREDENTIAL_ENCRYPTION_KEY: (process.env.CREDENTIAL_ENCRYPTION_KEY || 'agentflow_32_byte_aes_secret_key!').padEnd(32, '!').slice(0, 32),
  
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agentflow_ai',
  USE_IN_MEMORY_DB: process.env.USE_IN_MEMORY_DB === 'true' || process.env.USE_IN_MEMORY_DB === undefined,

  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  USE_IN_MEMORY_REDIS: process.env.USE_IN_MEMORY_REDIS === 'true' || process.env.USE_IN_MEMORY_REDIS === undefined,

  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID || '',
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET || '',
  GMAIL_REDIRECT_URI: process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/gmail/callback',

  SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID || '',
  SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET || '',
  SLACK_REDIRECT_URI: process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/slack/callback',

  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || '',
  DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/discord/callback',

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/google-sheets/callback',
};

module.exports = config;
