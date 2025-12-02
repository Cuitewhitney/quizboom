import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CreateQuiz() {
  const [title, setTitle] = useState('My Awesome Quiz');
  const [questions, setQuestions] = useState([
    {
      questionText: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      timeLimit: 20, // in seconds
    },
  ]);

  const navigate = useNavigate();

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: '', options: ['', '', '', ''], correctIndex: 0, timeLimit: 20 },
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    if (field === 'correct') {
      updated[index].correctIndex = parseInt(value);
    } else if (field === 'time') {
      updated[index].timeLimit = parseInt(value) || 20;
    } else if (field.startsWith('option')) {
      const optIndex = parseInt(field.split('-')[1]);
      updated[index].options[optIndex] = value;
    } else {
      updated[index][field] = value;
    }
    setQuestions(updated);
  };

  const saveQuiz = async () => {
    if (!questions.every(q => q.questionText && q.options.every(o => o))) {
      alert('Please fill all questions and options!');
      return;
    }

    try {
      const res = await axios.post('http://localhost:3000/api/create-quiz', {
        title,
        questions: questions.map(q => ({
          question: q.questionText,
          answers: q.options,
          correctAnswer: q.correctIndex,
          time: q.timeLimit,
        })),
      });

      const quizId = res.data.quizId;
      navigate(`/host?quizId=${quizId}`);
    } catch (err) {
      alert('Error saving quiz: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Create QuizBoom!
        </h1>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 text-xl mb-8 focus:outline-none focus:border-purple-500"
          placeholder="Quiz Title"
        />

        {questions.map((q, qIndex) => (
          <div key={qIndex} className="mb-10 p-6 bg-gray-800 rounded-xl border border-gray-700">
            <input
              type="text"
              placeholder={`Question ${qIndex + 1}`}
              value={q.questionText}
              onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
              className="w-full p-3 rounded bg-gray-700 mb-4 text-lg"
            />

            <div className="grid grid-cols-2 gap-4 mb-4">
              {q.options.map((opt, optIndex) => (
                <div key={optIndex} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={q.correctIndex === optIndex}
                    onChange={() => updateQuestion(qIndex, 'correct', optIndex)}
                  />
                  <input
                    type="text"
                    placeholder={`Option ${optIndex + 1}`}
                    value={opt}
                    onChange={(e) => updateQuestion(qIndex, `option-${optIndex}`, e.target.value)}
                    className={`w-full p-3 rounded-lg ${
                      q.correctIndex === optIndex ? 'bg-green-600' : 'bg-gray-700'
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <label>Time (seconds):</label>
              <input
                type="number"
                min="5"
                max="120"
                value={q.timeLimit}
                onChange={(e) => updateQuestion(qIndex, 'time', e.target.value)}
                className="w-24 p-2 bg-gray-700 rounded"
              />
            </div>
          </div>
        ))}

        <div className="flex justify-center gap-6 mt-10">
          <button
            onClick={addQuestion}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full font-bold text-lg hover:scale-105 transition"
          >
            + Add Question
          </button>
          <button
            onClick={saveQuiz}
            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-xl hover:scale-105 transition"
          >
            Save & Start Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateQuiz;