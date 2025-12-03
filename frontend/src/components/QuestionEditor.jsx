import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus } from 'lucide-react';

function SortableQuestion({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-6 h-6 text-gray-500 hover:text-white transition" />
        </div>
        {children}
      </div>
    </div>
  );
}

export default function QuestionEditor({ questions, setQuestions }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((q) => q.id === active.id);
        const newIndex = items.findIndex((q) => q.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        questionText: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        timeLimit: 20,
      },
    ]);
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? { ...q, options: q.options.map((opt, i) => i === optionIndex ? value : opt) }
        : q
    ));
  };

  const deleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  return (
    <div className="space-y-8">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
          {questions.map((q, qIndex) => (
            <SortableQuestion key={q.id} id={q.id}>
              <div className="flex-1 bg-gray-800/50 rounded-2xl p-6 border-2 border-gray-700">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-cyan-400">Question {qIndex + 1}</h3>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-red-500 hover:text-red-400 transition p-2 hover:bg-red-900/30 rounded-lg"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Enter your question..."
                  value={q.questionText}
                  onChange={(e) => updateQuestion(q.id, 'questionText', e.target.value)}
                  className="w-full text-3xl font-bold bg-transparent border-b-4 border-gray-600 focus:border-cyan-400 outline-none pb-3 mb-6 placeholder-gray-500"
                />

                <div className="grid grid-cols-2 gap-4 mb-6">
                  {q.options.map((option, i) => (
                    <div
                      key={i}
                      onClick={() => updateQuestion(q.id, 'correctIndex', i)}
                      className={`p-6 rounded-2xl text-2xl cursor-pointer transition-all border-4 ${
                        q.correctIndex === i
                          ? 'bg-green-600/80 border-green-400 shadow-lg shadow-green-500/50'
                          : 'bg-gray-700/70 border-gray-600 hover:bg-gray-600/70'
                      }`}
                    >
                      <input
                        type="text"
                        placeholder={`Option ${i + 1}`}
                        value={option}
                        onChange={(e) => updateOption(q.id, i, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-transparent outline-none placeholder-gray-400"
                      />
                      {q.correctIndex === i && (
                        <span className="ml-3 text-3xl">✓</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xl opacity-80">Time Limit:</span>
                    <select
                      value={q.timeLimit}
                      onChange={(e) => updateQuestion(q.id, 'timeLimit', Number(e.target.value))}
                      className="bg-gray-700 px-6 py-3 rounded-xl text-xl"
                    >
                      <option value={10}>10 sec</option>
                      <option value={20}>20 sec</option>
                      <option value={30}>30 sec</option>
                      <option value={60}>60 sec</option>
                      <option value={90}>90 sec</option>
                    </select>
                  </div>
                </div>
              </div>
            </SortableQuestion>
          ))}
        </SortableContext>
      </DndContext>

      {questions.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-3xl mb-4">No questions yet</p>
          <p className="text-xl">Click the button below to add your first question!</p>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={addQuestion}
          className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 text-3xl font-bold rounded-full hover:scale-110 transition shadow-2xl"
        >
          <Plus className="w-10 h-10" />
          Add New Question
        </button>
      </div>
    </div>
  );
}
