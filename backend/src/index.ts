import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import todosRouter from './routes/todos';
import teamsRouter from './routes/teams';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'TODO. API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req: Request, res: Response) => {
  res.json({ 
    message: 'TODO. API',
    version: '1.0.0'
  });
});

// TODO routes
app.use('/api/todos', todosRouter);

// Teams routes
app.use('/api/teams', teamsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
