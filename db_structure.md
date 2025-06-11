# Database Structure

## PostgreSQL Schema

### Tables

#### 1. users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. quizzes
```sql
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    topic VARCHAR(255) NOT NULL,
    question_count INTEGER NOT NULL CHECK (question_count BETWEEN 1 AND 20),
    questions JSONB NOT NULL,
    score INTEGER,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. shared_quizzes
```sql
CREATE TABLE shared_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id),
    shared_by UUID REFERENCES users(id),
    shared_with UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
```sql
CREATE INDEX idx_quizzes_topic ON quizzes(topic);
CREATE INDEX idx_quizzes_created_at ON quizzes(created_at);
CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_shared_quizzes_quiz_id ON shared_quizzes(quiz_id);
CREATE INDEX idx_shared_quizzes_shared_with ON shared_quizzes(shared_with);
```

## Database Setup

### Local Development
1. Install PostgreSQL locally or use Docker
2. Create database:
```sql
CREATE DATABASE quizapp;
```

### Docker Setup
The database will be automatically created and configured through Docker Compose.

## Data Types

### UUID
- Used for user and quiz IDs
- Generated automatically using `gen_random_uuid()`
- Used in shareable URLs

### JSONB
- Stores quiz questions and answers
- Structure:
```json
{
  "title": "Quiz Title",
  "questions": [
    {
      "question": "Question text",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "answer": "C",
      "explanation": "Explanation text"
    }
  ]
}
```

## Environment Variables
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=youruser
DB_PASSWORD=yourpass
DB_NAME=quizapp
JWT_SECRET=your_jwt_secret_here
```

## Backup and Restore

### Backup
```bash
pg_dump -U youruser quizapp > backup.sql
```

### Restore
```bash
psql -U youruser quizapp < backup.sql
``` 