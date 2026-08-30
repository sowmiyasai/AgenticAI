const { Server } = require('socket.io');

let io = null;

function initSocket(httpServer, clientUrl) {
  io = new Server(httpServer, {
    cors: {
      origin: clientUrl || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room for specific execution timeline
    socket.on('join:execution', (executionId) => {
      if (executionId) {
        socket.join(`execution:${executionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined execution room: execution:${executionId}`);
      }
    });

    // Leave execution room
    socket.on('leave:execution', (executionId) => {
      if (executionId) {
        socket.leave(`execution:${executionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} left execution room: execution:${executionId}`);
      }
    });

    // Join room for user notifications
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user room: user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

/**
 * Emit an agent event for an execution run
 */
function emitExecutionEvent(executionId, eventData) {
  if (io) {
    io.to(`execution:${executionId}`).emit('execution:event', eventData);
    // Also emit a general update
    io.emit('execution:update', {
      executionId,
      status: eventData.status,
      currentNode: eventData.nodeId,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Emit a user notification
 */
function emitUserNotification(userId, notification) {
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
    io.emit('notification:broadcast', notification);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitExecutionEvent,
  emitUserNotification,
};
