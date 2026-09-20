import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// Helper function to query Supabase REST API directly without broken external module imports
async function querySupabase(path: string, options: RequestInit = {}) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase environment variables are missing');
  }

  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Debug DB Endpoint
app.get('/api/debug-db', async (req: Request, res: Response) => {
  try {
    const data = await querySupabase('decisions?select=id&limit=1');
    res.status(200).json({ success: true, count: data?.length ?? 0, data });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || String(err),
    });
  }
});

// 3. Get All Decisions
app.get('/api/mizan/decisions', async (req: Request, res: Response) => {
  try {
    const rows = await querySupabase('decisions?select=id,guest_id,title,description,category,privacy,option_a,option_b,status,created_at,updated_at,votes(count),experiences(count)&order=created_at.desc&limit=50');
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
    res.status(500).json({ error: "تعذر الاتصال بقاعدة البيانات", details: err?.message });
  }
});

// 4. Get Single Decision
app.get('/api/mizan/decisions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rows = await querySupabase(`decisions?select=id,guest_id,title,description,category,privacy,option_a,option_b,status,created_at,updated_at,experiences(*)&id=eq.${id}`);
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

// 5. Post New Decision
app.post('/api/mizan/decisions', async (req: Request, res: Response) => {
  try {
    const { guestId, title, description, category, privacy, optionA, optionB } = req.body;
    const inserted = await querySupabase('decisions', {
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

// 6. Post Vote
app.post('/api/mizan/votes', async (req: Request, res: Response) => {
  try {
    const { decisionId, guestId, choice, experienceRelation } = req.body;
    await querySupabase('votes', {
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
