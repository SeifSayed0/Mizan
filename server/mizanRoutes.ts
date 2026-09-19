import type { Express, Request, Response } from "express";
import { z } from "zod";
import { supabaseRequest } from "./supabase";
import { sdk } from "./_core/sdk";
import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

const decisionFields = "id,guest_id,title,description,category,privacy,option_a,option_b,status,created_at,updated_at,votes(count),experiences(count)";
const decisionId = z.string().uuid();
const guestId = z.string().min(8).max(120);

function mapDecision(row: any) {
  return { id: row.id, guestId: row.guest_id, title: row.title, description: row.description ?? "", category: row.category, privacy: row.privacy, optionA: row.option_a, optionB: row.option_b, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, votes: row.votes?.[0]?.count ?? 0, experiences: row.experiences?.[0]?.count ?? 0 };
}
function mapExperience(row: any) {
  return { id: row.id, decisionId: row.decision_id, guestId: row.guest_id, name: row.name, age: row.age, title: row.title, body: row.body, outcome: row.outcome, likes: row.likes ?? 0, comments: row.comments ?? 0, status: row.status, createdAt: row.created_at };
}
function sendError(res: Response, error: unknown) {
  console.error("[Mizan API]", error);
  res.status(500).json({ error: "حدث خطأ أثناء الاتصال بقاعدة البيانات" });
}
async function requireOwner(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (user.role !== "admin") {
      res.status(403).json({ error: "هذه الصفحة مخصصة للمالك فقط" });
      return null;
    }
    return user;
  } catch {
    res.status(401).json({ error: "يجب تسجيل دخول المالك أولاً" });
    return null;
  }
}

export function registerMizanRoutes(app: Express) {
  app.get("/api/mizan/owner-login", (req, res) => {
    const portal = process.env.VITE_OAUTH_PORTAL_URL;
    const appId = process.env.VITE_APP_ID;
    if (!portal || !appId) return res.status(503).send("تسجيل دخول المالك غير مهيأ بعد");
    const nonce = crypto.randomUUID();
    const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
    const protocol = forwardedProto || req.protocol;
    const secure = protocol === "https";
    const redirectUri = `${protocol}://${req.get("host")}/api/oauth/callback`;
    const state = encodeOAuthState({ redirectUri, nonce });
    res.cookie(OAUTH_STATE_COOKIE, nonce, { path: "/", maxAge: 600000, sameSite: secure ? "none" : "lax", secure, httpOnly: true });
    const url = new URL(`${portal}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    res.redirect(url.toString());
  });

  app.get("/api/mizan/decisions", async (req, res) => {
    try {
      const parsed = z.coerce.number().int().min(1).max(50).catch(50).parse(req.query.limit);
      const rows = await supabaseRequest<any[]>(`decisions?select=${decisionFields}&status=eq.active&order=created_at.desc&limit=${parsed}`);
      res.json(rows.map(mapDecision));
    } catch (error) { sendError(res, error); }
  });

  app.get("/api/mizan/decisions/:id", async (req, res) => {
    try {
      const id = decisionId.parse(req.params.id);
      const rows = await supabaseRequest<any[]>(`decisions?select=${decisionFields}&id=eq.${id}&status=eq.active&limit=1`);
      if (!rows[0]) return res.status(404).json({ error: "القرار غير موجود" });
      const [votes, experiences] = await Promise.all([
        supabaseRequest<any[]>(`votes?select=choice,experience_relation&decision_id=eq.${id}&limit=1000`),
        supabaseRequest<any[]>(`experiences?select=id,decision_id,guest_id,name,age,title,body,outcome,likes,comments,status,created_at&decision_id=eq.${id}&status=eq.active&order=created_at.desc&limit=50`),
      ]);
      res.json({ ...mapDecision(rows[0]), votes: votes.length, voteRows: votes, experiences: experiences.map(mapExperience) });
    } catch (error) { sendError(res, error); }
  });

  app.post("/api/mizan/decisions", async (req, res) => {
    try {
      const input = z.object({ guestId, title: z.string().trim().min(8).max(180), description: z.string().trim().max(3000).optional().default(""), category: z.string().trim().min(2).max(60), privacy: z.enum(["عام", "مجهول للناس", "خاص برابط"]), optionA: z.string().trim().min(1).max(80), optionB: z.string().trim().min(1).max(80) }).parse(req.body);
      const rows = await supabaseRequest<any[]>("decisions", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ guest_id: input.guestId, title: input.title, description: input.description, category: input.category, privacy: input.privacy, option_a: input.optionA, option_b: input.optionB }) });
      res.status(201).json(mapDecision(rows[0]));
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "العنوان يجب أن يكون 8 أحرف على الأقل، مع كتابة الاختيارين" });
      sendError(res, error);
    }
  });

  app.post("/api/mizan/votes", async (req, res) => {
    try {
      const input = z.object({ decisionId, guestId, choice: z.enum(["a", "b"]), experienceRelation: z.string().max(60).optional() }).parse(req.body);
      const decisionRows = await supabaseRequest<any[]>(`decisions?select=id&id=eq.${input.decisionId}&status=eq.active&limit=1`);
      if (!decisionRows[0]) return res.status(404).json({ error: "القرار غير موجود أو لم يعد نشطًا" });
      const rows = await supabaseRequest<any[]>("votes?on_conflict=decision_id,guest_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ decision_id: input.decisionId, guest_id: input.guestId, choice: input.choice, experience_relation: input.experienceRelation ?? null }) });
      res.status(201).json(rows[0] ?? { success: true });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "بيانات التصويت غير صالحة، أعد فتح القرار ثم حاول مرة أخرى" });
      sendError(res, error);
    }
  });

  app.post("/api/mizan/experiences", async (req, res) => {
    try {
      const input = z.object({ decisionId, guestId, name: z.string().trim().min(2).max(80).default("ضيف ميزان"), age: z.number().int().min(13).max(100).optional(), title: z.string().trim().min(5).max(180), body: z.string().trim().min(20).max(5000), outcome: z.enum(["نجحت", "فشلت", "قريبة منها", "رأي فقط"]) }).parse(req.body);
      const rows = await supabaseRequest<any[]>("experiences", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ decision_id: input.decisionId, guest_id: input.guestId, name: input.name, age: input.age ?? null, title: input.title, body: input.body, outcome: input.outcome }) });
      res.status(201).json(mapExperience(rows[0]));
    } catch (error) { sendError(res, error); }
  });

  app.get("/api/mizan/owner", async (req, res) => {
    if (!await requireOwner(req, res)) return;
    try {
      const [decisions, experiences] = await Promise.all([
        supabaseRequest<any[]>(`decisions?select=${decisionFields}&order=created_at.desc&limit=100`),
        supabaseRequest<any[]>("experiences?select=id,decision_id,name,title,body,outcome,status,created_at&order=created_at.desc&limit=100"),
      ]);
      res.json({ decisions: decisions.map(mapDecision), experiences: experiences.map(mapExperience) });
    } catch (error) { sendError(res, error); }
  });

  app.patch("/api/mizan/owner/decisions/:id", async (req, res) => {
    if (!await requireOwner(req, res)) return;
    try {
      const id = decisionId.parse(req.params.id);
      const input = z.object({ title: z.string().trim().min(8).max(180).optional(), description: z.string().trim().max(3000).optional(), category: z.string().trim().min(2).max(60).optional(), optionA: z.string().trim().min(1).max(80).optional(), optionB: z.string().trim().min(1).max(80).optional(), status: z.enum(["active", "hidden", "archived"]).optional() }).parse(req.body);
      const patch = Object.fromEntries(Object.entries({ title: input.title, description: input.description, category: input.category, option_a: input.optionA, option_b: input.optionB, status: input.status, updated_at: new Date().toISOString() }).filter(([, value]) => value !== undefined));
      const rows = await supabaseRequest<any[]>(`decisions?id=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch) });
      res.json(rows[0] ? mapDecision(rows[0]) : null);
    } catch (error) { sendError(res, error); }
  });

  app.delete("/api/mizan/owner/decisions/:id", async (req, res) => {
    if (!await requireOwner(req, res)) return;
    try { const id = decisionId.parse(req.params.id); await supabaseRequest(`decisions?id=eq.${id}`, { method: "DELETE" }); res.json({ success: true }); } catch (error) { sendError(res, error); }
  });

  app.patch("/api/mizan/owner/experiences/:id", async (req, res) => {
    if (!await requireOwner(req, res)) return;
    try {
      const id = decisionId.parse(req.params.id);
      const input = z.object({ title: z.string().trim().min(5).max(180).optional(), body: z.string().trim().min(20).max(5000).optional(), outcome: z.enum(["نجحت", "فشلت", "قريبة منها", "رأي فقط"]).optional(), status: z.enum(["active", "hidden", "archived"]).optional() }).parse(req.body);
      const patch = Object.fromEntries(Object.entries({ ...input, updated_at: new Date().toISOString() }).filter(([, value]) => value !== undefined));
      const rows = await supabaseRequest<any[]>(`experiences?id=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch) });
      res.json(rows[0] ? mapExperience(rows[0]) : null);
    } catch (error) { sendError(res, error); }
  });

  app.delete("/api/mizan/owner/experiences/:id", async (req, res) => {
    if (!await requireOwner(req, res)) return;
    try { const id = decisionId.parse(req.params.id); await supabaseRequest(`experiences?id=eq.${id}`, { method: "DELETE" }); res.json({ success: true }); } catch (error) { sendError(res, error); }
  });
}
