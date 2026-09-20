import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { supabaseRequest } from '../server/supabase.js';

dotenv.config();

const app = express();
app.use(express.json());

// API Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1. Get Decisions
app.get('/api/mizan/decisions', async (req: Request, res: Response) => {
  try {
    const rows = await supabaseRequest('decisions?select=id,guest_id,title,description,category,privacy,option_a,option_b,status,created_at,updated_at,votes(count),experiences(count)&order=created_at.desc&limit=50');
    const mapped = (rows || []).map((row: any) => ({
      id: row.id,
      guestId: row.guest_id,
      title: row.title,
      description: row.description ?? "",
      category: row.category,
      privacy: row.privacy,
      optionA: row.option_a,
      optionB: row.option_b,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      votes: row.votes?.[0]?.count ?? 0,
      experiences: row.experiences?.[0]?.count ?? 0
    }));
    res.status(200).json(mapped);
  } catch (err: any) {
    console.error("[Mizan API Error]", err);
    res.status(500).json({ error: "تعذر الاتصال بقاعدة البيانات" });
  }
});

// 2. Get Single Decision
app.get('/api/mizan/decisions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rows = await supabaseRequest(`decisions?select=id,guest_id,title,description,category,privacy,option_a,option_b,status,created_at,updated_at,experiences(*)&id=eq.${id}`);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "القرار غير موجود" });
    }
    const d = rows[0];
    res.status(200).json({
      id: d.id,
      guestId: d.guest_id,
      title: d.title,
      description: d.description ?? "",
      category: d.category,
      privacy: d.privacy,
      optionA: d.option_a,
      optionB: d.option_b,
      status: d.status,
      createdAt: d.created_at,
      experiences: (d.experiences || []).map((e: any) => ({
        id: e.id,
        decisionId: e.decision_id,
        guestId: e.guest_id,
        name: e.name,
        age: e.age,
        title: e.title,
        body: e.body,
        outcome: e.outcome,
        likes: e.likes ?? 0,
        comments: e.comments ?? 0,
        status: e.status,
        createdAt: e.created_at
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: "حدث خطأ أثناء جلب التفاصيل" });
  }
});

// 3. Post New Decision
app.post('/api/mizan/decisions', async (req: Request, res: Response) => {
  try {
    const { guestId, title, description, category, privacy, optionA, optionB } = req.body;
    const inserted = await supabaseRequest('decisions', {
      method: 'POST',
      body: JSON.stringify({
        guest_id: guestId,
        title,
        description,
        category,
        privacy,
        option_a: optionA,
        option_b: optionB,
        status: 'published'
      })
    });
    res.status(201).json(inserted[0]);
  } catch (err: any) {
    res.status(500).json({ error: "تعذر نشر القرار" });
  }
});

// 4. Post Vote
app.post('/api/mizan/votes', async (req: Request, res: Response) => {
  try {
    const { decisionId, guestId, choice, experienceRelation } = req.body;
    await supabaseRequest('votes', {
      method: 'POST',
      body: JSON.stringify({
        decision_id: decisionId,
        guest_id: guestId,
        choice,
        experience_relation: experienceRelation
      })
    });
    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "تعذر تسجيل الصوت" });
  }
});

export default app;
