const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const { getExecutionQueue } = require('./queues/executionQueue');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const executionRoutes = require('./routes/executionRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO
initSocket(httpServer, config.CLIENT_URL);

// Security & Core Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: [config.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})); 

app.options(/.*/, cors({
  origin: [config.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiter for Auth Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in a few minutes.',
  },
});

app.use('/api/auth', authLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    name: 'Agentflow_AI Orchestration Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    storage: config.USE_IN_MEMORY_DB ? 'In-Memory DB' : 'MongoDB',
    queue: config.USE_IN_MEMORY_REDIS ? 'In-Memory Queue' : 'BullMQ/Redis',
    agents: ['Planner', 'Execution', 'Validation', 'Recovery', 'Monitoring'],
    integrations: ['gmail', 'slack', 'discord', 'google-sheets'],
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Central Error Handler
app.use(errorHandler);

// Server Boot Sequence
async function startServer() {
  try {
    const dbInfo = await connectDB();
    console.log(`[Server] Database ready (${dbInfo.type})`);

    // Initialize execution queue
    getExecutionQueue();

    const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`🚀 Agentflow_AI Server running on port: ${PORT}`);
      console.log(`🌐 Client Origin: ${config.CLIENT_URL}`);
      console.log(`⚡ Mode: ${config.NODE_ENV}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[Server Boot Error]:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, httpServer };
