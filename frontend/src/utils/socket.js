// frontend/src/utils/socket.js
import { io } from 'socket.io-client';

const socket = io('https://quizboom-backend.onrender.com', {
  transports: ['websocket'],
});



socket.on('connect', () => {
  console.log('Connected to QuizBoom backend!');
});

socket.on('connect_error', (err) => {
  console.log('WebSocket connection error:', err.message);
});

export default socket;
