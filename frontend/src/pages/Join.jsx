import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../utils/socket'; 

function Join() {
  const [gamePIN, setGamePIN] = useState('');
  const [nickname, setNickname] = useState('');
  const [step, setStep] = useState('pin'); 
  const [error, setError] = useState('');
  const navigate = useNavigate();


  useEffect(() => {
    socket.connect(); 

    const handleSuccess = () => {
      setError('');
      setStep('waiting');
      navigate(`/play?pin=${gamePIN}&nick=${encodeURIComponent(nickname.trim())}`);
    };

    const handleError = (msg) => {
      setError(msg || 'Could not join the game');
      setStep('nickname'); 
    };

    socket.on('join-success', handleSuccess);
    socket.on('join-error', handleError);

    
    return () => {
      socket.off('join-success', handleSuccess);
      socket.off('join-error', handleError);
    };
  }, [gamePIN, nickname, navigate]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (gamePIN.length === 6 && /^\d+$/.test(gamePIN)) {
      setStep('nickname');
      setError('');
    } else {
      setError('Please enter a valid 6-digit PIN');
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Please choose a nickname!');
      return;
    }

    setError('');
    socket.emit('join-game', {
      gamePIN,
      nickname: nickname.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-rose-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-7xl font-black text-center mb-16 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
          QuizBoom!
        </h1>

        {/*  Enter the game PIN */}
        {step === 'pin' && (
          <form onSubmit={handlePinSubmit} className="space-y-8">
            <div>
              <label className="text-2xl block mb-4 text-white/90">Enter Game PIN</label>
              <input
                type="text"
                maxLength="6"
                value={gamePIN}
                onChange={(e) => setGamePIN(e.target.value.replace(/\D/g, ''))}
                className="w-full text-6xl text-center font-bold tracking-widest bg-black/30 border-4 border-white/20 rounded-3xl py-8 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition"
                placeholder="000000"
                autoFocus
              />
            </div>

            {error && <p className="text-red-400 text-center text-xl font-semibold">{error}</p>}

            <button
              type="submit"
              className="w-full py-8 text-3xl font-bold bg-gradient-to-r from-cyan-500 to-purple-600 rounded-3xl hover:scale-105 transition shadow-2xl"
            >
              JOIN GAME
            </button>
          </form>
        )}

        {/* Choose Nickname */}
        {step === 'nickname' && (
          <form onSubmit={handleJoin} className="space-y-8">
            <div>
              <label className="text-2xl block mb-4 text-white/90">Choose your nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength="15"
                className="w-full text-4xl text-center font-bold bg-black/30 border-4 border-white/20 rounded-3xl py-8 text-white placeholder-gray-500 focus:outline-none focus:border-pink-400 transition"
                placeholder="Epic Gamer"
                autoFocus
              />
            </div>

            {error && <p className="text-red-400 text-center text-xl font-semibold">{error}</p>}

            <button
              type="submit"
              className="w-full py-8 text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl hover:scale-105 transition shadow-2xl"
            >
              LET'S GO!
            </button>
          </form>
        )}

        {step === 'waiting' && (
          <div className="text-center animate-pulse">
            <h2 className="text-5xl font-bold mb-8 text-white">You're in!</h2>
            <p className="text-3xl text-white/90">Waiting for the host to start...</p>
            <div className="mt-16">
              <div className="inline-block w-24 h-24 border-8 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Join;