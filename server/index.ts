import express from 'express';

const app = express();

app.use(express.json());

// API Health Check
app.get('/api/health', (req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback for root API
app.get('/api', (req: any, res: any) => {
  res.json({ message: 'Mizan API is running' });
});

export default app;
