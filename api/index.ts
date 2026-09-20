import express, { Request, Response } from 'express';

const app = express();

app.use(express.json());

// API Health Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Root Fallback
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Mizan API is working perfectly!' });
});

export default app;
