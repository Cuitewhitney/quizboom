// frontend/src/utils/socket.js
import { io } from 'socket.io-client';

// THIS IS THE ONLY VERSION THAT WORKS ON RENDER
const socket = io('https://quizboom-backend.onrender.com', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket'],           // ← Force WebSocket only
  upgrade: false,                      // ← Prevent fallback to polling
  forceNew: true
});

socket.on('connect', () => {
  console.log('Connected to QuizBoom backend!');
});

socket.on('connect_error', () => {
  console.log('WebSocket connection error:', error);
});

export default socket;
