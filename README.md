# AI Quiz App

A full-stack quiz application that generates quizzes using the Gemini AI API. Users can create quizzes on any topic and share them with others.

## Features

- Generate quizzes on any topic using AI
- Choose the number of questions (1-20)
- Multiple choice questions with explanations
- Share quizzes via unique URLs
- Track scores and progress
- Modern, responsive UI with TailwindCSS

## Tech Stack

- **Frontend:** React + TypeScript + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **AI:** Google Gemini Pro API
- **Containerization:** Docker + Docker Compose

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (if running locally)
- Google Gemini API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd quiz-app
```

2. Create a `.env` file in the root directory:
```env
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=quizapp
DB_HOST=localhost
DB_PORT=5432
GEMINI_API_KEY=your_gemini_api_key
```

3. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

4. Start the application using Docker Compose:
```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm start
```

## API Endpoints

### Generate Quiz
```http
POST /api/generate-quiz
Content-Type: application/json

{
  "topic": "World History",
  "questionCount": 5
}
```

### Get Quiz
```http
GET /api/quiz/:id
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 