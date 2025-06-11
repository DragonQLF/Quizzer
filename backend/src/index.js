require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const auth = require('./middleware/auth');

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
  const { topic, questionCount } = req.body;
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Gere um quiz sobre ${topic} com ${questionCount} questões de múltipla escolha. 
    Cada questão deve ter 4 opções e uma resposta correta. 
    Formate a resposta como um array JSON de objetos com a seguinte estrutura:
    [
      {
        "question": "Texto da pergunta",
        "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"],
        "correctAnswer": "Texto da opção correta"
      }
    ]`;
    
    const result = await model.generateContent({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });
    
    const response = await result.response;
    const responseText = response.text();
    console.log('Gemini API response:', responseText);
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
      console.error('Failed to parse Gemini response as JSON:', parseErr);
      return res.status(500).json({ message: 'Gemini API did not return valid JSON', raw: responseText });
    }
    
    console.log('Parsed quiz data:', quizData);
    
    // Save quiz to database
    const dbResult = await pool.query(
      'INSERT INTO quizzes (user_id, topic, question_count, questions) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, topic, questionCount, JSON.stringify(quizData)]
    );
    
    res.json(dbResult.rows[0]);
  } catch (err) {
    console.error(err);
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
  tr
  ic, question_count, created_at, score, completed FROM quizzes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
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
    const result = await pool.query(
      'UPDATE quizzes SET score = $1, completed = true WHERE id = $2 AND user_id = $3 RETURNING *',
      [score, req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Quiz not found or unauthorized' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating quiz' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 