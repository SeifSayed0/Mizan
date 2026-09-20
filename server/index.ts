import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Safe Mizan Routes Loader
app.get('/api/mizan/decisions', async (req: Request, res: Response) => {
  try {
    const { registerMizanRoutes } = await import('./mizanRoutes');
    // إذا نجح الاستدعاء
    res.status(200).json({ message: "Routes module loaded successfully" });
  } catch (err: any) {
    // طباعة تفاصيل الخطأ بدلاً من الانهيار
    res.status(500).json({ 
      error: "Failed to load mizanRoutes", 
      details: err?.message || String(err),
      stack: err?.stack
    });
  }
});

export default app;
