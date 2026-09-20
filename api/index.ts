import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// Helper function to query Supabase REST API directly
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
    const rows = await querySupabase('decisions?select=*&order=created_at.desc&limit=50');
    const mapped = (rows || []).map((row: any) => ({
      id: row.id,
      guestId: row.guest_id || row.guestId || "",
      title: row.title,
      description: row.description ?? "",
      category: row.category ?? "عام",
      privacy: row.privacy ?? "public",
      optionA: row.option_a || row.optionA || "الخيار الأول",
      optionB: row.option_b || row.optionB || "الخيار الثاني",
      status: row.status ?? "published",
      createdAt: row.created_at || row.createdAt,
      updatedAt: row.updated_at || row.updatedAt,
      votes: row.votes_count ?? 0,
      experiences: row.experiences_count ?? 0
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
    const rows = await querySupabase(`decisions?select=*&id=eq.${id}`);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "القرار غير موجود" });
    }
    const d = rows[0];
    
    // Fetch experiences if available
    let exps: any[] = [];
    try {
      exps = await querySupabase(`experiences?select=*&decision_id=eq.${id}`);
    } catch (_) {}

    res.status(200).json({
      id: d.id,
      guestId: d.guest_id || d.guestId || "",
      title: d.title,
      description: d.description ?? "",
      category: d.category ?? "عام",
      privacy: d.privacy ?? "public",
      optionA: d.option_a || d.optionA || "الخيار الأول",
      optionB: d.option_b || d.optionB || "الخيار الثاني",
      status: d.status ?? "published",
      createdAt: d.created_at || d.createdAt,
      experiences: (exps || []).map((e: any) => ({
        id: e.id,
        decisionId: e.decision_id || e.decisionId,
        guestId: e.guest_id || e.guestId,
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
    
    // Payload with safe fallback schema attributes
    const payload: Record<string, any> = {
      title,
      description: description || "",
      category: category || "عام",
      privacy: privacy || "public",
      status: 'published'
    };

    if (guestId) payload.guest_id = guestId;
    if (optionA) payload.option_a = optionA;
    if (optionB) payload.option_b = optionB;

    const inserted = await querySupabase('decisions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const result = Array.isArray(inserted) ? inserted[0] : inserted;
    res.status(201).json(result || { success: true });
  } catch (err: any) {
    console.error("Error creating decision:", err);
    res.status(500).json({ error: "تعذر إنشاء القرار", details: err?.message });
  }
});

// 6. Post Vote
app.post('/api/mizan/votes', async (req: Request, res: Response) => {
  try {
    const { decisionId, guestId, choice, experienceRelation } = req.body;
    
    const payload: Record<string, any> = {
      choice: choice || "optionA"
    };

    if (decisionId) payload.decision_id = decisionId;
    if (guestId) payload.guest_id = guestId;
    if (experienceRelation) payload.experience_relation = experienceRelation;

    await querySupabase('votes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    res.status(201).json({ success: true });
  } catch (err: any) {
    console.error("Error submitting vote:", err);
    res.status(500).json({ error: "تعذر تسجيل الصوت", details: err?.message });
  }
});

export default app;
