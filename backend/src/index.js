require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'quizzer',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Ensure static/uploads directory exists
const uploadsDir = path.join(__dirname, '../static/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Serve static files
app.use('/static', express.static(path.join(__dirname, '../static')));

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );
    
    // Generate token
    const token = jwt.sign(
      { id: result.rows[0].id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Quiz Routes
app.post('/api/generate-quiz', auth, async (req, res) => {
  const { topic, questionCount, existingQuestions, language } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    let prompt = `Gere um quiz sobre o tópico: \"${topic || 'um tópico à sua escolha'}\" com ${questionCount} perguntas de múltipla escolha únicas.\nCada pergunta deve:\n- Ser clara, factual e não ambígua.\n- Ser escrita em ${language || 'português'}.\n- Ter exatamente 4 opções de resposta (A, B, C, D).\n- Ter apenas uma resposta correta.\n`;
    if (existingQuestions && Array.isArray(existingQuestions) && existingQuestions.length > 0) {
      prompt += `- Não repita nenhuma destas perguntas já existentes:\n${existingQuestions.map((q, i) => `${i+1}. ${q}`).join(' ')}\n`;
    }
    prompt += `\nFormate sua resposta como um array JSON de objetos, cada um com:\n{\n  \"question\": \"Texto da pergunta\",\n  \"options\": [\"Opção A\", \"Opção B\", \"Opção C\", \"Opção D\"],\n  \"correctAnswer\": \"Texto exato da opção correta\"\n}\nNão inclua explicações, texto extra ou blocos de código. Retorne apenas o array JSON.`;
    const result = await model.generateContent({
      contents: [{
        parts: [{ text: prompt }]
      }]
    });
    const response = await result.response;
    const responseText = response.text();
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '');
    }
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '');
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.replace(/```$/, '');
    }
    let quizData;
    try {
      quizData = JSON.parse(cleanedText);
    } catch (parseErr) {
      return res.status(500).json({ message: 'Gemini API did not return valid JSON', raw: responseText });
    }
    res.json({ questions: quizData });
  } catch (err) {
    res.status(500).json({ message: 'Error generating quiz' });
  }
});

app.get('/api/quiz/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM quizzes WHERE id = $1', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Get user's quizzes
app.get('/api/quizzes', auth, async (req, res) => {
  try {
    const { excludePublicAttempts } = req.query;
    
    // Get user's own quizzes
    const ownQuizzes = await pool.query(
      'SELECT id, topic, question_count, created_at, score, completed FROM quizzes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    let allQuizzes = [...ownQuizzes.rows];

    // Only include public quiz attempts if not explicitly excluded
    if (!excludePublicAttempts || excludePublicAttempts !== 'true') {
      // Get public quizzes the user has attempted
      const attemptedQuizzes = await pool.query(
        `SELECT q.id, q.topic, q.question_count, q.created_at, qa.score, true as completed, true as is_public_attempt
         FROM quiz_attempts qa
         JOIN quizzes q ON qa.quiz_id = q.id
         WHERE qa.user_id = $1 AND q.public = true
         ORDER BY qa.completed_at DESC`,
        [req.user.id]
      );

      allQuizzes = [...ownQuizzes.rows, ...attemptedQuizzes.rows];
    }

    // Sort by most recent
    allQuizzes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(allQuizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching quizzes' });
  }
});

// Get user data
app.get('/api/user', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Delete a quiz
app.delete('/api/quizzes/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM quizzes WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Quiz not found or unauthorized' });
    }
    
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting quiz' });
  }
});

// Share a quiz
app.post('/api/quizzes/:id/share', auth, async (req, res) => {
  const { email } = req.body;
  
  try {
    // Check if the quiz exists and belongs to the user
    const quizResult = await pool.query(
      'SELECT * FROM quizzes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ message: 'Quiz not found or unauthorized' });
    }
    
    // Check if the recipient exists
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Create a shared quiz entry
    await pool.query(
      'INSERT INTO shared_quizzes (quiz_id, shared_by, shared_with) VALUES ($1, $2, $3)',
      [req.params.id, req.user.id, userResult.rows[0].id]
    );
    
    res.json({ message: 'Quiz shared successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sharing quiz' });
  }
});

// Update quiz score and completion status
app.put('/api/quizzes/:id/complete', auth, async (req, res) => {
  const { score } = req.body;
  
  try {
    // First check if this is a public quiz
    const quizResult = await pool.query(
      'SELECT * FROM quizzes WHERE id = $1',
      [req.params.id]
    );
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    const quiz = quizResult.rows[0];
    
    if (quiz.public) {
      // For public quizzes, record the attempt in quiz_attempts table
      const attemptResult = await pool.query(
        'INSERT INTO quiz_attempts (user_id, quiz_id, score) VALUES ($1, $2, $3) ON CONFLICT (user_id, quiz_id) DO UPDATE SET score = $3, completed_at = CURRENT_TIMESTAMP RETURNING *',
        [req.user.id, req.params.id, score]
      );
      res.json(attemptResult.rows[0]);
    } else {
      // For private quizzes, update the original quiz (only if user owns it)
      const result = await pool.query(
        'UPDATE quizzes SET score = $1, completed = true WHERE id = $2 AND user_id = $3 RETURNING *',
        [score, req.params.id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Quiz not found or unauthorized' });
      }
      
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating quiz' });
  }
});

// Record quiz attempt (for public quizzes)
app.post('/api/quizzes/:id/attempt', auth, async (req, res) => {
  const { score } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO quiz_attempts (user_id, quiz_id, score) VALUES ($1, $2, $3) ON CONFLICT (user_id, quiz_id) DO UPDATE SET score = $3, completed_at = CURRENT_TIMESTAMP RETURNING *',
      [req.user.id, req.params.id, score]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error recording quiz attempt' });
  }
});

// Public Quizzes Route
app.get('/api/public-quizzes', async (req, res) => {
  try {
    // Check if user is authenticated
    const token = req.headers.authorization?.split(' ')[1];
    let userId = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId || decoded.id; // Support both keys
      } catch (err) {
        // Token is invalid, but we'll still return public quizzes without user data
      }
    }
    
    if (userId) {
      // User is authenticated, include completion status
      const result = await pool.query(
        `SELECT 
          q.id, 
          q.topic, 
          q.question_count, 
          q.created_at,
          qa.score,
          CASE WHEN qa.user_id IS NOT NULL THEN true ELSE false END as completed
        FROM quizzes q
        LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.user_id = $1
        WHERE q.public = TRUE 
        ORDER BY q.created_at DESC`,
        [userId]
      );
      res.json(result.rows);
    } else {
      // User is not authenticated, return basic quiz info
      const result = await pool.query(
        'SELECT id, topic, question_count, created_at FROM quizzes WHERE public = TRUE ORDER BY created_at DESC'
      );
      res.json(result.rows);
    }
  } catch (err) {
    console.error('Error fetching public quizzes:', err);
    res.status(500).json({ message: 'Error fetching public quizzes' });
  }
});

// Update a quiz (topic, questions, question_count, public)
app.put('/api/quizzes/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { topic, questions, question_count, public: isPublic } = req.body;

  if (!topic || !Array.isArray(questions) || typeof question_count !== 'number') {
    return res.status(400).json({ message: 'Invalid input' });
  }

  try {
    // Only allow update if the quiz belongs to the user
    const quizResult = await pool.query(
      'SELECT * FROM quizzes WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ message: 'Quiz not found or unauthorized' });
    }

    const updateResult = await pool.query(
      'UPDATE quizzes SET topic = $1, questions = $2, question_count = $3, public = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [topic, JSON.stringify(questions), question_count, isPublic === true, id, req.user.id]
    );
    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating quiz' });
  }
});

// Image upload endpoint
app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const url = `${req.protocol}://${req.get('host')}/static/uploads/${req.file.filename}`;
  res.json({ url });
});

// Create a new quiz
app.post('/api/quizzes', auth, async (req, res) => {
  const { topic, questions, question_count, public: isPublic } = req.body;

  if (!topic || !Array.isArray(questions) || typeof question_count !== 'number') {
    return res.status(400).json({ message: 'Invalid input' });
  }

  try {
    const dbResult = await pool.query(
      'INSERT INTO quizzes (user_id, topic, question_count, questions, public) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, topic, question_count, JSON.stringify(questions), isPublic === true]
    );
    res.json(dbResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating quiz' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 