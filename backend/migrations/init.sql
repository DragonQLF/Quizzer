-- Each question in the 'questions' JSONB array should have the following structure:
-- {
--   "text": "Question text",
--   "options": ["A", "B", "C", "D"],
--   "correctIndex": 1,
--   "image_url": "https://...", -- optional
--   "time_limit": 30              -- optional, in seconds
-- }

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    topic VARCHAR(255) NOT NULL,
    question_count INTEGER NOT NULL,
    questions JSONB NOT NULL,
    score INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 

CREATE TABLE IF NOT EXISTS shared_quizzes (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id),
    shared_by INTEGER REFERENCES users(id),
    shared_with INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    quiz_id INTEGER REFERENCES quizzes(id),
    score INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quiz_id)
); 