import React, { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface CreateQuizModalProps {
  open: boolean;
  onClose: () => void;
  onQuizCreated: () => void;
}

const CreateQuizModal: React.FC<CreateQuizModalProps> = ({ open, onClose, onQuizCreated }) => {
  const [tab, setTab] = useState<'manual' | 'ai'>('manual');
  // Manual form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualTopic, setManualTopic] = useState('');
  const [manualQuestions, setManualQuestions] = useState([
    { question: '', options: { A: '', B: '', C: '', D: '' }, answer: '', explanation: '' }
  ]);
  // AI form state
  const [aiTitle, setAiTitle] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualPublic, setManualPublic] = useState(false);
  const [aiPublic, setAiPublic] = useState(false);
  // const [categories, setCategories] = useState<Category[]>([]);

  // useEffect(() => {
  //   const fetchCategories = async () => {
  //     try {
  //       const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/categories`);
  //       if (response.ok) {
  //         const data = await response.json();
  //         setCategories(data);
  //       }
  //     } catch (err) {
  //       console.error('Failed to fetch categories:', err);
  //     }
  //   };
  //   fetchCategories();
  // }, []);

  if (!open) return null;

  const handleManualQuestionChange = (idx: number, field: string, value: string) => {
    setManualQuestions(qs => {
      const copy = [...qs];
      if (field.startsWith('option-')) {
        const opt = field.split('-')[1];
        copy[idx].options[opt as 'A'|'B'|'C'|'D'] = value;
      } else {
        (copy[idx] as any)[field] = value;
      }
      return copy;
    });
  };

  const addManualQuestion = () => {
    setManualQuestions(qs => [...qs, { question: '', options: { A: '', B: '', C: '', D: '' }, answer: '', explanation: '' }]);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: manualTopic,
          questions: manualQuestions,
          question_count: manualQuestions.length,
          public: manualPublic,
        }),
      });
      onQuizCreated();
      onClose();
    } catch (err) {
      setError('Failed to create quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: aiTopic,
          questionCount: aiCount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const quizData = await response.json();
      
      // Create the quiz with the generated questions
      const createResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: aiTopic,
          questions: quizData.questions,
          question_count: aiCount,
          public: aiPublic,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create quiz');
      }

      onQuizCreated();
      onClose();
    } catch (err) {
      setError('Failed to generate quiz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
        <div className="flex mb-4 border-b">
          <button className={`px-4 py-2 font-semibold ${tab==='manual'?'border-b-2 border-indigo-500':''}`} onClick={()=>setTab('manual')}>Manual Creation</button>
          <button className={`px-4 py-2 font-semibold ${tab==='ai'?'border-b-2 border-indigo-500':''}`} onClick={()=>setTab('ai')}>Generate with AI</button>
        </div>
        {tab === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <input type="text" className="w-full border rounded p-2" placeholder="Quiz Title" value={manualTitle} onChange={e=>setManualTitle(e.target.value)} required />
            <input type="text" className="w-full border rounded p-2" placeholder="Quiz Topic" value={manualTopic} onChange={e=>setManualTopic(e.target.value)} required />
            <div className="flex items-center mb-2">
              <input type="checkbox" id="manual-public" checked={manualPublic} onChange={e=>setManualPublic(e.target.checked)} className="mr-2" />
              <label htmlFor="manual-public" className="text-sm">Make this quiz public</label>
            </div>
            <div>
              <div className="font-semibold mb-2">Questions</div>
              {manualQuestions.map((q, idx) => (
                <div key={idx} className="mb-4 border p-2 rounded">
                  <input type="text" className="w-full mb-1 border rounded p-1" placeholder="Question" value={q.question} onChange={e=>handleManualQuestionChange(idx, 'question', e.target.value)} required />
                  <div className="flex gap-2 mb-1">
                    {(['A','B','C','D'] as const).map(opt => (
                      <input key={opt} type="text" className="flex-1 border rounded p-1" placeholder={`Option ${opt}`} value={q.options[opt]} onChange={e=>handleManualQuestionChange(idx, `option-${opt}`, e.target.value)} required />
                    ))}
                  </div>
                  <input type="text" className="w-full mb-1 border rounded p-1" placeholder="Correct Option (A/B/C/D)" value={q.answer} onChange={e=>handleManualQuestionChange(idx, 'answer', e.target.value)} required />
                  <input type="text" className="w-full border rounded p-1" placeholder="Explanation" value={q.explanation} onChange={e=>handleManualQuestionChange(idx, 'explanation', e.target.value)} />
                </div>
              ))}
              <button type="button" className="text-indigo-600 hover:underline" onClick={addManualQuestion}>+ Add Question</button>
            </div>
            {error && <div className="text-red-500">{error}</div>}
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Creating...' : 'Create Quiz'}</button>
          </form>
        ) : (
          <form onSubmit={handleAiSubmit} className="space-y-4">
            <input type="text" className="w-full border rounded p-2" placeholder="Quiz Topic (e.g., 'Cristiano Ronaldo', 'World War II', 'Python Programming')" value={aiTopic} onChange={e=>setAiTopic(e.target.value)} required />
            <input type="number" className="w-full border rounded p-2" placeholder="Number of Questions" min={1} max={20} value={aiCount} onChange={e=>setAiCount(Number(e.target.value))} required />
            <div className="flex items-center mb-2">
              <input type="checkbox" id="ai-public" checked={aiPublic} onChange={e=>setAiPublic(e.target.checked)} className="mr-2" />
              <label htmlFor="ai-public" className="text-sm">Make this quiz public</label>
            </div>
            {error && <div className="text-red-500">{error}</div>}
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Generating...' : 'Generate Quiz'}</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateQuizModal; 