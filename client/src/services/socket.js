import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export function getSocket() {
  if (!socket && typeof window !== 'undefined') {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO Client] Connected to server, ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO Client] Disconnected:', reason);
    });
  }
  return socket;
}

export function joinExecutionRoom(executionId) {
  const s = getSocket();
  if (s && executionId) {
    s.emit('join:execution', executionId);
  }
}

export function leaveExecutionRoom(executionId) {
  const s = getSocket();
  if (s && executionId) {
    s.emit('leave:execution', executionId);
  }
}

export function joinUserRoom(userId) {
  const s = getSocket();
  if (s && userId) {
    s.emit('join:user', userId);
  }
}
