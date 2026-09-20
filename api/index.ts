import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url = '' } = req;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Health check
    if (url.includes('/api/health')) {
      return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // 2. Debug DB
    if (url.includes('/api/debug-db')) {
      const data = await querySupabase('decisions?select=id&limit=1');
      return res.status(200).json({ success: true, count: data?.length ?? 0, data });
    }

    // 3. Post Vote
    if (url.includes('/api/mizan/votes') && method === 'POST') {
      const { decisionId, guestId, choice, experienceRelation } = req.body || {};
      const payload: Record<string, any> = { choice: choice || 'optionA' };
      if (decisionId) payload.decision_id = decisionId;
      if (guestId) payload.guest_id = guestId;
      if (experienceRelation) payload.experience_relation = experienceRelation;

      await querySupabase('votes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return res.status(201).json({ success: true });
    }

    // 4. Post New Decision
    if (url.includes('/api/mizan/decisions') && method === 'POST') {
      const { guestId, title, description, category, privacy, optionA, optionB } = req.body || {};
      const payload: Record<string, any> = {
        title,
        description: description || '',
        category: category || 'عام',
        privacy: privacy || 'public',
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
      return res.status(201).json(result || { success: true });
    }

    // 5. Get All / Single Decision
    if (url.includes('/api/mizan/decisions') && method === 'GET') {
      const match = url.match(/\/api\/mizan\/decisions\/([^\/\?]+)/);
      if (match) {
        const id = match[1];
        const rows = await querySupabase(`decisions?select=*&id=eq.${id}`);
        if (!rows || rows.length === 0) {
          return res.status(404).json({ error: 'القرار غير موجود' });
        }
        const d = rows[0];
        let exps: any[] = [];
        try { exps = await querySupabase(`experiences?select=*&decision_id=eq.${id}`); } catch (_) {}

        return res.status(200).json({
          id: d.id,
          guestId: d.guest_id || d.guestId || '',
          title: d.title,
          description: d.description ?? '',
          category: d.category ?? 'عام',
          privacy: d.privacy ?? 'public',
          optionA: d.option_a || d.optionA || 'الخيار الأول',
          optionB: d.option_b || d.optionB || 'الخيار الثاني',
          status: d.status ?? 'published',
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
      }

      const rows = await querySupabase('decisions?select=*&order=created_at.desc&limit=50');
      const mapped = (rows || []).map((row: any) => ({
        id: row.id,
        guestId: row.guest_id || row.guestId || '',
        title: row.title,
        description: row.description ?? '',
        category: row.category ?? 'عام',
        privacy: row.privacy ?? 'public',
        optionA: row.option_a || row.optionA || 'الخيار الأول',
        optionB: row.option_b || row.optionB || 'الخيار الثاني',
        status: row.status ?? 'published',
        createdAt: row.created_at || row.createdAt,
        updatedAt: row.updated_at || row.updatedAt,
        votes: row.votes_count ?? 0,
        experiences: row.experiences_count ?? 0
      }));
      return res.status(200).json(mapped);
    }

    return res.status(404).json({ error: 'Endpoint not found' });
  } catch (err: any) {
    console.error('[API Error]', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err?.message });
  }
}
