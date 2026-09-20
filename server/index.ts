import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { registerMizanRoutes } from './mizanRoutes';

dotenv.config();

const app = express();

app.use(express.json());

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Root Check
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Mizan API is running!' });
});

// Register Mizan Endpoints (/api/mizan/*)
registerMizanRoutes(app);

export default app;
