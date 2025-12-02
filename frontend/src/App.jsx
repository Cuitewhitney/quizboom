import { useState } from 'react';
import { Link } from 'react-router-dom';

function App() {
  const [darkMode] = useState(true);

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-900 text-white ${darkMode ? 'dark' : ''}`}>
      <div className="text-center">
        <h1 className="text-7xl font-black mb-8 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          QuizBoom!
        </h1>
        <p className="text-2xl mb-12">The ultimate live quiz experience</p>
        
        <Link to="/create">
          <button className="px-16 py-8 text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:scale-110 transition shadow-2xl">
            Create a Quiz
          </button>
        </Link>
      </div>
    </div>
  );
}

export default App;