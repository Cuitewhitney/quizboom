const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'QuizBoom Backend is LIVE! 🚀 Create quizzes at /api/create-quiz' });
});

// In-memory storage
const quizzes = {}; // { quizId: { title, questions: [{ question, answers, correctAnswer, time }] } }
const games = {};   // { gamePIN: { hostSocket, players: { socketId: { nickname, score, hasAnswered } }, quiz, currentQuestion, status, timeLeft } }

// API: Create quiz
app.post('/api/create-quiz', (req, res) => {
  const quizId = uuidv4();
  quizzes[quizId] = {
    title: req.body.title || 'Untitled Quiz',
    questions: req.body.questions || []
  };
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
    console.log(`Game created! PIN: ${gamePIN}`);
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

    // Notify everyone in the room
    io.to(gamePIN).emit('player-joined', { nickname });
    io.to(game.hostSocket).emit('player-joined', { nickname });
  });

  // HOST: Start the game
  socket.on('host-start-game', ({ pin }) => {
    const game = games[pin];
    if (!game || game.hostSocket !== socket.id || game.status !== 'lobby') return;

    game.status = 'playing';
    game.currentQuestion = 0;
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
      const points = Math.ceil((game.timeLeft || 5) * 50); // Max 1000 points
      player.score += points;
    }
  });

  function startNextQuestion(pin) {
    const game = games[pin];
    if (!game || game.currentQuestion >= game.quiz.questions.length) {
      endGame(pin);
      return;
    }

    const q = game.quiz.questions[game.currentQuestion];
    game.timeLeft = q.time || 20;

    // Reset answers
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
    console.log(`Game ${pin} ended. Winner: ${results[0]?.nickname || 'No one'}`);
    delete games[pin];
  }

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove player from any game
    Object.keys(games).forEach(pin => {
      const game = games[pin];
      if (game.players[socket.id]) {
        delete game.players[socket.id];
        io.to(pin).emit('player-left', { playerId: socket.id });
      }
    });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`QuizBoom server running on http://localhost:${PORT}`);
});
