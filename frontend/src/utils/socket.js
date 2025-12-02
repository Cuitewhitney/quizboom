// frontend/src/utils/socket.js
import { io } from 'socket.io-client';

const socket = io('https://quizboom.onrender.com', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 10,
});


socket.on('connect', () => {
  console.log('Connected to QuizBoom backend!');
});

socket.on('connect_error', () => {
  console.log('WebSocket connection error:', error);
});

export default socket;
