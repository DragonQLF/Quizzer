import React, { useState, useEffect } from 'react';
import QuizQuestionCard from './QuizQuestionCard';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  image_url?: string;
  time_limit?: number;
}

interface ManualQuizCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quiz: { topic: string; questions: Question[] }) => void;
  onAIGenerate?: (topic: string, count: number) => Promise<Question[]>;
  initialQuiz?: {
    id?: string;
    topic: string;
    questions: Question[];
  };
  onUpdate?: (quiz: { id: string; topic: string; questions: Question[] }) => void;
}

const defaultQuestion = (): Question => ({
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  image_url: '',
  time_limit: 30,
});

const ManualQuizCreator: React.FC<ManualQuizCreatorProps> = ({ isOpen, onClose, onSave, onAIGenerate, initialQuiz, onUpdate }) => {
  const [topic, setTopic] = useState(initialQuiz?.topic || '');
  const [questions, setQuestions] = useState<Question[]>(initialQuiz?.questions || [defaultQuestion()]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialQuiz) {
      setTopic(initialQuiz.topic);
      setQuestions(initialQuiz.questions);
    } else if (isOpen && !initialQuiz) {
      setTopic('');
      setQuestions([defaultQuestion()]);
    }
  }, [isOpen, initialQuiz]);

  const handleQuestionCardChange = (qIdx: number, field: keyof Question, value: any) => {
    setQuestions(qs => {
      const updated = [...qs];
      if (field === 'options' && value) {
        const opts = [...updated[qIdx].options];
        opts[value.idx] = value.value;
        updated[qIdx].options = opts;
      } else {
        (updated[qIdx] as any)[field] = value;
      }
      return updated;
    });
  };

  const addQuestion = () => setQuestions(qs => [...qs, defaultQuestion()]);
  const removeQuestion = (idx: number) => setQuestions(qs => qs.length > 1 ? qs.filter((_, i) => i !== idx) : qs);

  const handleSave = () => {
    if (initialQuiz && initialQuiz.id && onUpdate) {
      onUpdate({ id: initialQuiz.id, topic, questions });
    } else {
      onSave({ topic, questions });
    }
    onClose();
  };

  const handleAIGenerate = async () => {
    if (!onAIGenerate) return;
    setAiLoading(true);
    try {
      const aiQuestions = await onAIGenerate(topic, 5);
      setQuestions(aiQuestions);
    } finally {
      setAiLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create a Quiz</h2>
        <label className="block mb-2 font-semibold">Topic</label>
        <input
          className="w-full border rounded p-2 mb-4"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="Quiz topic"
        />
        <div className="flex gap-2 mb-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={addQuestion}
          >Add Question</button>
          {onAIGenerate && (
            <button
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              onClick={handleAIGenerate}
              disabled={aiLoading}
            >{aiLoading ? 'Generating...' : 'Generate with AI'}</button>
          )}
        </div>
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="relative mb-8">
            <button
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10"
              onClick={() => removeQuestion(qIdx)}
              title="Remove question"
            >✕</button>
            <QuizQuestionCard
              question={q}
              editable={true}
              onChange={(field, value) => handleQuestionCardChange(qIdx, field, value)}
            />
          </div>
        ))}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            onClick={onClose}
          >Cancel</button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleSave}
          >Save Quiz</button>
        </div>
      </div>
    </div>
  );
};

export default ManualQuizCreator; 