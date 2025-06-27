import React, { useState, useEffect } from 'react';
import QuizQuestionCard from './QuizQuestionCard';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { FaMagic } from 'react-icons/fa';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  image_url?: string;
  time_limit?: number;
}

const defaultQuestion = (): Question => ({
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  image_url: '',
  time_limit: 30,
});

const QuizCreatorPage: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([defaultQuestion()]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [quizId, setQuizId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [aiCount, setAICount] = useState(5);
  const [aiLoading, setAILoading] = useState(false);
  const [aiMode, setAIMode] = useState<'replace' | 'add'>('replace');
  const [useCurrentTopic, setUseCurrentTopic] = useState(true);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLanguage, setAiLanguage] = useState('Portuguese');
  const [publicQuiz, setPublicQuiz] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const navigate = useNavigate();
  const location = useLocation();

  // Parse ?id=... from query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setQuizId(id);
      // Fetch quiz data
      (async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/quiz/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setTopic(response.data.topic || '');
          setQuestions(response.data.questions || [defaultQuestion()]);
        } catch (err) {
          setError('Failed to load quiz for editing.');
        }
      })();
    }
  }, [location.search]);

  // Mark as dirty on any change
  useEffect(() => { setDirty(true); }, [topic, questions]);

  // Confirm before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeRoute = (e: any) => {
      if (dirty && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        e.preventDefault();
        navigate(location.pathname, { replace: true });
      }
    };
    window.addEventListener('popstate', handleBeforeRoute);
    return () => window.removeEventListener('popstate', handleBeforeRoute);
  }, [dirty, navigate, location.pathname]);

  const handleQuestionChange = (field: keyof Question, value: any) => {
    setQuestions(qs => {
      const updated = [...qs];
      if (field === 'options' && value) {
        const opts = [...updated[currentIdx].options];
        opts[value.idx] = value.value;
        updated[currentIdx].options = opts;
      } else {
        (updated[currentIdx] as any)[field] = value;
      }
      return updated;
    });
  };

  const addQuestion = () => {
    setQuestions(qs => [...qs, defaultQuestion()]);
    setCurrentIdx(questions.length); // go to new question
  };

  const removeCurrentQuestion = () => {
    if (questions.length === 1) return;
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    setQuestions(qs => {
      const updated = qs.filter((_, i) => i !== currentIdx);
      return updated;
    });
    setCurrentIdx(idx => Math.max(0, idx - 1));
  };

  const goToPrev = () => setCurrentIdx(idx => Math.max(0, idx - 1));
  const goToNext = () => setCurrentIdx(idx => Math.min(questions.length - 1, idx + 1));

  const validate = () => {
    if (!topic.trim()) return 'Quiz topic is required.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1} text is required.`;
      if (q.options.length !== 4 || q.options.some(opt => !opt.trim())) return `All 4 options are required for question ${i + 1}.`;
      if (q.correctIndex < 0 || q.correctIndex > 3 || !q.options[q.correctIndex].trim()) return `Select a correct answer for question ${i + 1}.`;
    }
    return '';
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setValidationError('');
    const v = validate();
    if (v) {
      setValidationError(v);
      setSaving(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (quizId) {
        await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/quizzes/${quizId}`, {
          topic,
          questions,
          question_count: questions.length,
          public: publicQuiz,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/quizzes`, {
          topic,
          questions,
          question_count: questions.length,
          public: publicQuiz,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setDirty(false);
      navigate('/');
    } catch (err) {
      setError('Failed to save quiz.');
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAILoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        topic: useCurrentTopic ? topic : aiTopic,
        questionCount: aiCount,
        existingQuestions: aiMode === 'add' ? questions.map(q => q.text) : undefined,
        language: aiLanguage
      };
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/generate-quiz`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const rawAIQuestions = res.data.questions || res.data;
      const aiQuestions = rawAIQuestions.map((q: any) => ({
        text: q.question,
        options: q.options,
        correctIndex: q.options.findIndex((opt: string) => opt === q.correctAnswer),
        image_url: '',
        time_limit: 30
      }));
      if (aiMode === 'replace') {
        setQuestions(aiQuestions);
        setCurrentIdx(0);
      } else {
        setQuestions(qs => [...qs, ...aiQuestions]);
        setCurrentIdx(questions.length);
      }
      if (!useCurrentTopic) {
        setTopic(aiTopic);
      }
      setShowAIModal(false);
    } catch (err) {
      setToast({ message: 'AI generation failed. Please try again.', visible: true });
    } finally {
      setAILoading(false);
    }
  };

  // Toast auto-hide effect
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => setToast({ ...toast, visible: false }), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-10 px-2 md:px-0">
      {/* Toast notification */}
      {toast.visible && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg font-semibold animate-fade-in">
          {toast.message}
        </div>
      )}
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 shadow-2xl rounded-3xl p-6 md:p-10 border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {quizId ? 'Edit Quiz' : 'Create a Quiz'}
          </h1>
          <button
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2 rounded-full shadow transition focus:outline-none focus:ring-2 focus:ring-green-400"
            onClick={() => setShowAIModal(true)}
          >
            Generate with AI
          </button>
        </div>
        {showAIModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
            <form onSubmit={handleAIGenerate} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Generate Quiz with AI</h3>
              <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Topic</label>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={useCurrentTopic}
                  onChange={e => setUseCurrentTopic(e.target.checked)}
                  id="use-current-topic"
                  className="mr-2 accent-green-500"
                />
                <label htmlFor="use-current-topic" className="text-sm">Use current topic/title</label>
              </div>
              <input
                className="w-full border rounded-full p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                value={useCurrentTopic ? topic : aiTopic}
                onChange={e => useCurrentTopic ? undefined : setAiTopic(e.target.value)}
                placeholder="Quiz topic"
                required
                disabled={useCurrentTopic}
              />
              <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Number of Questions</label>
              <input
                type="number"
                min={1}
                max={20}
                className="w-full border rounded-full p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                value={aiCount}
                onChange={e => setAICount(Number(e.target.value))}
                required
              />
              <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">How do you want to use the generated questions?</label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="aiMode"
                    value="replace"
                    checked={aiMode === 'replace'}
                    onChange={() => setAIMode('replace')}
                    className="accent-green-500"
                  />
                  Replace current quiz
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="aiMode"
                    value="add"
                    checked={aiMode === 'add'}
                    onChange={() => setAIMode('add')}
                    className="accent-green-500"
                  />
                  Add to current quiz
                </label>
              </div>
              <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Language</label>
              <select
                className="w-full border rounded-full p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                value={aiLanguage}
                onChange={e => setAiLanguage(e.target.value)}
              >
                <option value="Portuguese">Portuguese</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setShowAIModal(false)}
                  disabled={aiLoading}
                >Cancel</button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-full font-bold hover:bg-green-700 shadow"
                  disabled={aiLoading}
                >{aiLoading ? 'Generating...' : 'Generate'}</button>
              </div>
            </form>
          </div>
        )}
        <div className="mb-6">
          <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">Topic</label>
          <input
            className="w-full border rounded-full p-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white mb-2"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Quiz topic"
          />
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4 bg-blue-50 dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm border border-blue-100 dark:border-gray-700">
          <button
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full font-bold shadow transition focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={addQuestion}
          >
            <Plus className="w-5 h-5" /> Add Question
          </button>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 shadow"
              onClick={goToPrev}
              disabled={currentIdx === 0}
              title="Previous Question"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-gray-700 dark:text-gray-200">{currentIdx + 1} / {questions.length}</span>
            <button
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 shadow"
              onClick={goToNext}
              disabled={currentIdx === questions.length - 1}
              title="Next Question"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            className="p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition shadow"
            onClick={removeCurrentQuestion}
            disabled={questions.length === 1}
            title="Remove Question"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {topic ? topic : 'Untitled Quiz'}
          </h2>
          <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>
        {questions[currentIdx] && (
          <div className="mb-2 text-gray-700 dark:text-gray-200">
            <span className="font-semibold">Correct Answer: </span>
            {questions[currentIdx].options[questions[currentIdx].correctIndex]
              ? questions[currentIdx].options[questions[currentIdx].correctIndex]
              : <span className="italic text-gray-400">Not selected</span>}
          </div>
        )}
        <QuizQuestionCard
          question={questions[currentIdx]}
          editable={true}
          onChange={handleQuestionChange}
        />
        {validationError && <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-2 mt-2"><svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z' /></svg>{validationError}</div>}
        {error && <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4 mt-2"><svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z' /></svg>{error}</div>}
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="public-quiz"
            checked={publicQuiz}
            onChange={e => setPublicQuiz(e.target.checked)}
            className="mr-2 accent-green-500"
          />
          <label htmlFor="public-quiz" className="text-sm">Make this quiz public</label>
        </div>
        <div className="flex justify-end mt-8 sticky bottom-0 z-10">
          <button
            className="bg-green-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-green-700 transition-all focus:outline-none focus:ring-2 focus:ring-green-400"
            onClick={handleSave}
            disabled={saving}
          >{saving ? 'Saving...' : quizId ? 'Update Quiz' : 'Save Quiz'}</button>
        </div>
      </div>
    </div>
  );
};

export default QuizCreatorPage; 