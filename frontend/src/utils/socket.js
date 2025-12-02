// frontend/src/utils/socket.js
import { io } from 'socket.io-client';

// const socket = io('https://quizboom-backend.onrender.com', {
//   autoConnect: true,
//   reconnection: true,
//   reconnectionAttempts: 5,
//   reconnectionDelay: 1000,
//   timeout: 20000,
//   transports: ['websocket'],  // Force WebSocket (no polling on Render)
//   upgrade: false,             // Prevent HTTP long-polling fallback
//   path: '/socket.io'
// });
const socket = io('https://quizboom-backend.onrender.com', {
  autoConnect: true,
  transports: ['websocket']
});

// Debug logs for troubleshooting
socket.on('connect', () => console.log('✅ Socket connected to backend!'));
socket.on('disconnect', () => console.log('❌ Socket disconnected'));
socket.on('connect_error', (err) => console.log('🔴 Socket error:', err.message));
socket.on('game-created', (data) => console.log('🎯 Game created event received:', data));

export default socket;
