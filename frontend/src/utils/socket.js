import { io } from 'socket.io-client';

const socket = io('https://quizboom-backend.onrender.com', {
  autoConnect: true,
  transports: ['websocket']   
});

export default socket;
