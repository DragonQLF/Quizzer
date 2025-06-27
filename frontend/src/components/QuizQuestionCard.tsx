import React from 'react';
import axios from 'axios';

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  image_url?: string;
  time_limit?: number;
}

interface QuizQuestionCardProps {
  question: Question;
  editable?: boolean;
  onChange?: (field: keyof Question, value: any) => void;
}

const kahootShapes = [
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><polygon points="16,4 28,28 4,28" fill="white"/></svg>, // Triangle
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="8" y="8" width="16" height="16" rx="4" fill="white"/></svg>, // Diamond
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="12" fill="white"/></svg>, // Circle
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="6" y="6" width="20" height="20" fill="white"/></svg> // Square
];
const kahootColors = [
  'bg-red-500 hover:bg-red-600',
  'bg-blue-500 hover:bg-blue-600',
  'bg-yellow-400 hover:bg-yellow-500',
  'bg-green-500 hover:bg-green-600'
];

const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({ question, editable = false, onChange }) => {
  const [uploading, setUploading] = React.useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/upload`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onChange) onChange('image_url', res.data.url);
    } catch (err) {
      alert('Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 shadow-2xl rounded-3xl px-8 pt-8 pb-6 mb-8 max-w-3xl mx-auto border border-gray-100 dark:border-gray-700">
      {/* Image upload and preview at top center */}
      {editable && (
        <div className="flex flex-col items-center mb-2">
          <label className="cursor-pointer flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2 shadow hover:bg-gray-200 dark:hover:bg-gray-600 transition mb-2">
            <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{question.image_url ? 'Change Image' : '+ Upload Image'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
          {uploading && <span className="text-xs text-gray-500 mt-1">Uploading...</span>}
        </div>
      )}
      {question.image_url && (
        <div className="flex justify-center mb-4">
          <img src={question.image_url} alt="Question" className="max-h-48 rounded-xl shadow-lg object-contain" />
        </div>
      )}
      {/* Time limit badge at top right */}
      {editable ? (
        <div className="absolute top-6 right-8 flex items-center gap-2">
          <span className="bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-100 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">Time Limit:</span>
          <input
            type="number"
            min={5}
            max={300}
            className="w-16 border border-gray-300 dark:border-gray-600 rounded-full px-2 py-1 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={question.time_limit || 30}
            onChange={e => onChange && onChange('time_limit', Number(e.target.value))}
          />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">s</span>
        </div>
      ) : (
        <div className="absolute top-6 right-8 bg-indigo-100 dark:bg-indigo-700 text-indigo-700 dark:text-indigo-100 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
          {question.time_limit || 30} s
        </div>
      )}
      {/* Question text */}
      {editable ? (
        <textarea
          className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white mb-8 text-center w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:border-indigo-500 placeholder-gray-400 dark:placeholder-gray-500 resize-none overflow-auto min-h-[3.5rem] max-h-40 break-words"
          value={question.text}
          onChange={e => onChange && onChange('text', e.target.value)}
          placeholder="Enter question text"
          rows={2}
        />
      ) : (
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white mb-8 text-center break-words whitespace-pre-line">
          {question.text}
        </h2>
      )}
      {/* Options 2x2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-4">
        {question.options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className={`relative w-full h-20 md:h-24 rounded-2xl text-white font-extrabold text-lg md:text-2xl flex items-center justify-center transition-all duration-200 transform ${kahootColors[idx]} shadow-md border-2 ${question.correctIndex === idx ? 'border-indigo-400 scale-105' : 'border-transparent'} ${editable ? 'cursor-text' : 'cursor-pointer'} group`}
              tabIndex={-1}
            >
              <span className="absolute left-4 top-4">{kahootShapes[idx]}</span>
              {editable ? (
                <input
                  className="bg-transparent border-b border-gray-200 dark:border-gray-500 focus:outline-none focus:border-indigo-300 text-white w-full ml-12 text-lg md:text-2xl font-extrabold placeholder-gray-200 dark:placeholder-gray-400"
                  value={opt}
                  onChange={e => onChange && onChange('options', { idx, value: e.target.value })}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                />
              ) : (
                <span className="ml-12">{String.fromCharCode(65 + idx)} {opt}</span>
              )}
            </div>
            {editable && (
              <input
                type="radio"
                name="correct"
                checked={question.correctIndex === idx}
                onChange={() => onChange && onChange('correctIndex', idx)}
                className="ml-2 accent-indigo-500 w-5 h-5"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizQuestionCard; 