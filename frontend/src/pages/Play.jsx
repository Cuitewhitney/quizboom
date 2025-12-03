import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import socket from '../utils/socket';

const COLORS = ['bg-red-600', 'bg-blue-600', 'bg-yellow-500', 'bg-green-600'];
const SHAPES = ['Triangle', 'Square', 'Diamond', 'Circle'];

export default function Play() {
  const [searchParams] = useSearchParams();
  const nick = decodeURIComponent(searchParams.get('nick') || 'Player');
  const pin = searchParams.get('pin');

  const [gameState, setGameState] = useState('waiting');
  const [question, setQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [finalResults, setFinalResults] = useState([]);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on('question-start', (data) => {
      setQuestion(data);
      setTimeLeft(data.time);
      setGameState('question');
      setHasAnswered(false);
    });

    socket.on('countdown', (seconds) => setTimeLeft(seconds));

    socket.on('question-end', () => {
      setGameState('answered');
    });

    socket.on('leaderboard', (board) => {
      setLeaderboard(board);
      setGameState('leaderboard');
    });

    socket.on('game-end', (results) => {
      setFinalResults(results);
      setGameState('final');
    });

    return () => socket.off();
  }, []);

  const submitAnswer = (index) => {
    if (hasAnswered) return;
    setHasAnswered(true);
    socket.emit('submit-answer', { pin, answerIndex: index });
  };

  // WAITING SCREEN
  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 flex flex-col items-center justify-center text-white">
        <h1 className="text-5xl font-black mb-8 animate-bounce">Ready, {nick}!</h1>
        <p className="text-4xl">Get ready...</p>
        <div className="mt-20 flex gap-8">
          {COLORS.map((color, i) => (
            <div key={i} className={`w-22 h-22 ${color} rounded-3xl animate-pulse`} style={{ animationDelay: `${i * 200}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  // QUESTION SCREEN
  if (gameState === 'question' || gameState === 'answered') {
    const progress = question ? (timeLeft / question.time) * 100 : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col items-center justify-center text-white p-8">
        <div className="w-full max-w-5xl text-center">
          <h2 className="text-6xl font-black mb-6">{question?.question}</h2>
          <div className="text-5xl font-bold mb-4">{timeLeft}s</div>
          <div className="h-8 bg-gray-800 rounded-full overflow-hidden mb-10">
            <div className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="grid grid-cols-2 gap-10">
            {question?.answers?.map((ans, i) => (
              <button
                key={i}
                onClick={() => submitAnswer(i)}
                disabled={hasAnswered}
                className={`relative p-20 text-5xl font-bold rounded-3xl transition-all ${COLORS[i]} ${
                  hasAnswered ? 'opacity-60' : 'hover:scale-105 shadow-2xl'
                }`}
              >
                <span className="absolute top-6 left-6 text-9xl opacity-30">{SHAPES[i]}</span>
                <span className="block mt-12">{ans}</span>
              </button>
            ))}
          </div>

          {hasAnswered && <p className="mt-12 text-4xl animate-pulse">Waiting for others...</p>}
        </div>
      </div>
    );
  }

  // LEADERBOARD
  if (gameState === 'leaderboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 to-purple-900 flex flex-col items-center justify-center text-white">
        <h1 className="text-8xl font-black mb-20">Leaderboard</h1>
        <div className="space-y-8">
          {leaderboard.map((p, i) => (
            <div key={i} className="bg-black/50 rounded-3xl px-20 py-10 text-6xl font-bold flex justify-between w-96">
              <span>{i + 1}. {p.nickname}</span>
              <span className="text-yellow-400">{p.score} pts</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // FINAL PODIUM
  if (gameState === 'final') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-600 via-pink-600 to-purple-800 flex flex-col items-center justify-center text-white">
        <h1 className="text-9xl font-black mb-16 animate-bounce">Game Over!</h1>
        <div className="space-y-12">
          {finalResults.slice(0, 3).map((p, i) => (
            <div key={i} className="text-center">
              <div className="text-9xl mb-4">{['1st Place', '2nd Place', '3rd Place'][i]}</div>
              <div className="text-8xl font-black text-cyan-400">{p.nickname}</div>
              <div className="text-7xl text-yellow-300">{p.score} points</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
