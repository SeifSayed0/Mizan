import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import and register Mizan routes with error handling
app.use(async (req: Request, res: Response, next: any) => {
  try {
    const { registerMizanRoutes } = await import('../server/mizanRoutes');
    const router = express.Router();
    registerMizanRoutes(app);
    next();
  } catch (err) {
    next();
  }
});

export default app;
