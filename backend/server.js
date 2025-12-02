// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// CORS: Allow your live frontend (and localhost during dev)
const allowedOrigins = [
  'https://quizboom.onrender.com',  // ← Your live frontend
  'http://localhost:5173'           // ← Local dev
];

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// }));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));


// Socket.IO CORS (same rules)
// const io = new Server(server, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ['GET', 'POST'],
//     credentials: true
//   },
//   transports: ['websocket']  // ← Forces secure WebSocket (critical for Render!)
// });
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket']
});


// app.use(express.json());
app.use(express.json());

app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io-client/dist'));

// Your existing app.get('/', ...) continues here

// Health check route (what you see when visiting backend URL)
app.get('/', (req, res) => {
  res.json({ 
    message: 'QuizBoom Backend is LIVE! Create quizzes at /api/create-quiz',
    status: 'healthy',
    playersOnline: Object.keys(io.sockets.sockets).length
  });
});

// Force HTTPS on Render
app.use((req, res, next) => {
  if (process.env.RENDER && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }
  next();
});

// In-memory storage
const quizzes = {};
const games = {};

// API: Create quiz
app.post('/api/create-quiz', (req, res) => {
  const quizId = uuidv4();
  quizzes[quizId] = {
    title: req.body.title || 'Untitled Quiz',
    questions: req.body.questions || []
  };
  console.log(`Quiz created: ${quizId} - ${quizzes[quizId].title}`);
  res.json({ quizId });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // HOST: Create game
  socket.on('start-game', ({ quizId }) => {
    if (!quizzes[quizId]) {
      return socket.emit('error', 'Quiz not found');
    }

    const gamePIN = Math.floor(100000 + Math.random() * 900000).toString();
    games[gamePIN] = {
      hostSocket: socket.id,
      players: {},
      quiz: quizzes[quizId],
      currentQuestion: 0,
      status: 'lobby',
      timeLeft: 0
    };

    socket.join(gamePIN);
    console.log(`Game created! PIN: ${gamePIN} | Host: ${socket.id}`);
    socket.emit('game-created', { gamePIN });
  });

  // PLAYER: Join game
  socket.on('join-game', ({ gamePIN, nickname }) => {
    const game = games[gamePIN];
    if (!game || game.status !== 'lobby') {
      return socket.emit('join-error', 'Game not found or already started');
    }

    game.players[socket.id] = {
      nickname: nickname.trim(),
      score: 0,
      hasAnswered: false
    };

    socket.join(gamePIN);
    socket.emit('join-success');

    // Notify everyone
    io.to(gamePIN).emit('player-joined', { nickname });
    console.log(`${nickname} joined game ${gamePIN}`);
  });

  // HOST: Start the game
  socket.on('host-start-game', ({ pin }) => {
    const game = games[pin];
    if (!game || game.hostSocket !== socket.id || game.status !== 'lobby') return;

    game.status = 'playing';
    console.log(`Game ${pin} started by host`);
    startNextQuestion(pin);
  });

  // PLAYER: Submit answer
  socket.on('submit-answer', ({ pin, answerIndex }) => {
    const game = games[pin];
    if (!game || !game.players[socket.id] || game.players[socket.id].hasAnswered) return;

    const player = game.players[socket.id];
    player.hasAnswered = true;

    const question = game.quiz.questions[game.currentQuestion];
    if (question.correctAnswer === answerIndex) {
      const points = Math.ceil((game.timeLeft || 5) * 50);
      player.score += points;
    }
  });

  function startNextQuestion(pin) {
    const game = games[pin];
    if (!game || game.currentQuestion >= game.quiz.questions.length) {
      return endGame(pin);
    }

    const q = game.quiz.questions[game.currentQuestion];
    game.timeLeft = q.time || 20;

    Object.values(game.players).forEach(p => p.hasAnswered = false);

    io.to(pin).emit('question-start', {
      question: q.question,
      answers: q.answers,
      time: game.timeLeft,
      index: game.currentQuestion
    });

    const timer = setInterval(() => {
      game.timeLeft--;
      io.to(pin).emit('countdown', game.timeLeft);

      if (game.timeLeft <= 0) {
        clearInterval(timer);
        io.to(pin).emit('question-end');
        setTimeout(() => showLeaderboard(pin), 3000);
      }
    }, 1000);
  }

  function showLeaderboard(pin) {
    const game = games[pin];
    const board = Object.values(game.players)
      .map(p => ({ nickname: p.nickname, score: p.score }))
      .sort((a, b) => b.score - a.score);

    io.to(pin).emit('leaderboard', board);
    game.currentQuestion++;
    setTimeout(() => startNextQuestion(pin), 7000);
  }

  function endGame(pin) {
    const game = games[pin];
    if (!game) return;

    const results = Object.values(game.players)
      .map(p => ({ nickname: p.nickname, score: p.score }))
      .sort((a, b) => b.score - a.score);

    io.to(pin).emit('game-end', results);
    console.log(`Game ${pin} ended. Winner: ${results[0]?.nickname || 'None'}`);
    delete games[pin];
  }

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    Object.keys(games).forEach(pin => {
      const game = games[pin];
      if (game && game.players[socket.id]) {
        delete game.players[socket.id];
        io.to(pin).emit('player-left', { playerId: socket.id });
      }
    });
  });
});

// Use Render's port or 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`QuizBoom server running on port ${PORT}`);
});
