import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import socket from '../utils/socket';

const PODIUM = ['1st Place', '2nd Place', '3rd Place'];
const TROPHY = ['Trophy 1st', 'Trophy 2nd', 'Trophy 3rd'];

export default function Host() {
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get('quizId');

  const [gamePIN, setGamePIN] = useState('Waiting...');
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('lobby');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [finalResults, setFinalResults] = useState([]);

  useEffect(() => {
    if (!quizId) return;

    // socket.emit('start-game', { quizId });

    // socket.on('game-created', ({ gamePIN }) => setGamePIN(gamePIN));
    // socket.on('player-joined', ({ nickname }) => {
    //   setPlayers(prev => [...prev, { nickname, score: 0 }]);
    // });

    console.log('🔄 Emitting start-game with quizId:', quizId);
    socket.emit('start-game', { quizId });

    socket.on('game-created', ({ gamePIN }) => {
      console.log('🎯 PIN received:', gamePIN);
      setGamePIN(gamePIN);
    });

  socket.on('error', (msg) => {
    console.log('🚨 Game creation error:', msg);
    setGamePIN('Error: ' + msg);
  });

    socket.on('question-start', (data) => {
      setCurrentQuestion(data); 
      setQuestionIndex(data.index + 1);
      setGameStatus('playing');
    });

    socket.on('question-end', () => setCurrentQuestion(null));

    socket.on('leaderboard', (board) => {
      setLeaderboard(board);
      setGameStatus('leaderboard');
      setPlayers(board);
    });

    socket.on('game-end', (results) => {
      setFinalResults(results);
      setGameStatus('finished');
      setPlayers(results);
    });

    return () => socket.off();
  }, [quizId]);

  const startGame = () => {
    socket.emit('host-start-game', { pin: gamePIN });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* LEFT PANEL */}
      <div className="w-96 bg-gradient-to-b from-purple-900 to-black p-8 flex flex-col">
        <h1 className="text-6xl font-black text-center mb-8">QuizBoom!</h1>

        <div className="bg-black/60 rounded-3xl p-8 text-center mb-8">
          <p className="text-2xl opacity-80">Game PIN</p>
          <div className="text-8xl font-bold text-cyan-400">{gamePIN}</div>
        </div>

        <h2 className="text-3xl font-bold mb-4">Players ({players.length})</h2>
        <div className="flex-1 overflow-y-auto space-y-3 mb-6">
          {players.length === 0 ? (
            <p className="text-gray-500 text-center py-10">Waiting...</p>
          ) : (
            players.map((p, i) => (
              <div key={i} className="bg-gray-800/80 rounded-2xl px-6 py-4 flex justify-between">
                <span className="text-xl font-semibold">{i + 1}. {p.nickname}</span>
                <span className="text-3xl font-bold text-yellow-400">{p.score || 0}</span>
              </div>
            ))
          )}
        </div>

        {gameStatus === 'lobby' && players.length > 0 && (
          <button
            onClick={startGame}
            className="w-full py-8 bg-gradient-to-r from-green-500 to-emerald-600 text-5xl font-black rounded-3xl hover:scale-105 transition shadow-2xl"
          >
            START GAME
          </button>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-12">
        {gameStatus === 'lobby' && (
          <div className="text-center">
            <h2 className="text-7xl font-black">Get Ready!</h2>
          </div>
        )}

        {gameStatus === 'playing' && currentQuestion && (
          <div className="text-center max-w-6xl">
            <h3 className="text-5xl font-bold mb-8 text-cyan-400">
              Question {questionIndex}
            </h3>
            <h2 className="text-8xl font-black mb-16 leading-tight">
              {currentQuestion.question}
            </h2>
            <div className="grid grid-cols-2 gap-12">
              {currentQuestion.answers?.map((ans, i) => (
                <div key={i} className="bg-gray-800/80 rounded-3xl p-16 text-5xl font-bold text-center">
                  {ans}
                </div>
              ))}
            </div>
          </div>
        )}

        {gameStatus === 'leaderboard' && (
          <div className="text-center">
            <h2 className="text-8xl font-black mb-20 text-yellow-400">Leaderboard</h2>
            {leaderboard.map((p, i) => (
              <div key={i} className="bg-black/60 rounded-3xl px-20 py-10 text-6xl font-bold flex justify-between max-w-4xl mx-auto my-4">
                <span>{i + 1}. {p.nickname}</span>
                <span className="text-yellow-400">{p.score} pts</span>
              </div>
            ))}
          </div>
        )}

        {gameStatus === 'finished' && (
          <div className="text-center">
            <h1 className="text-9xl font-black mb-16 text-yellow-400">Game Over!</h1>
            {finalResults.slice(0, 3).map((p, i) => (
              <div key={i} className="my-12">
                <div className="text-9xl mb-4">{TROPHY[i]}</div>
                <div className="text-8xl font-black text-cyan-400">{p.nickname}</div>
                <div className="text-7xl text-yellow-300">{p.score} points</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
