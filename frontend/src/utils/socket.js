import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  autoConnect: true,
  reconnection: true,
});

console.log('Socket created and auto-connected'); // ← you will see this in browser console

export default socket;