import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { supabaseRequest } from "./supabase";
import { z } from "zod";

const uuid = z.string().uuid();
const guestId = z.string().min(8).max(120);

const decisionFields = "id,guest_id,title,description,category,privacy,option_a,option_b,status,created_at,updated_at,votes(count),experiences(count)";

function mapDecision(row: any) {
  return {
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
    experiences: row.experiences?.[0]?.count ?? 0,
  };
}

function mapExperience(row: any) {
  return {
    id: row.id,
    decisionId: row.decision_id,
    guestId: row.guest_id,
    name: row.name,
    age: row.age,
    title: row.title,
    body: row.body,
    outcome: row.outcome,
    likes: row.likes ?? 0,
    comments: row.comments ?? 0,
    status: row.status,
    createdAt: row.created_at,
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  content: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().int().min(1).max(50).default(50) }))
      .query(async ({ input }) => {
        const rows = await supabaseRequest<any[]>(
          `decisions?select=${decisionFields}&status=eq.active&order=created_at.desc&limit=${input.limit}`
        );
        return rows.map(mapDecision);
      }),
    get: publicProcedure
      .input(z.object({ id: uuid }))
      .query(async ({ input }) => {
        const rows = await supabaseRequest<any[]>(
          `decisions?select=${decisionFields}&id=eq.${input.id}&limit=1`
        );
        const decision = rows[0] ? mapDecision(rows[0]) : null;
        if (!decision) return null;
        const [voteRows, experienceRows] = await Promise.all([
          supabaseRequest<any[]>(`votes?select=choice,experience_relation&decision_id=eq.${input.id}&limit=1000`),
          supabaseRequest<any[]>(`experiences?select=id,decision_id,guest_id,name,age,title,body,outcome,likes,comments,status,created_at&decision_id=eq.${input.id}&status=eq.active&order=created_at.desc&limit=50`),
        ]);
        return { ...decision, voteRows, experiences: experienceRows.map(mapExperience) };
      }),
    create: publicProcedure
      .input(z.object({
        guestId,
        title: z.string().trim().min(8).max(180),
        description: z.string().trim().max(3000).optional().default(""),
        category: z.string().trim().min(2).max(60),
        privacy: z.enum(["عام", "مجهول للناس", "خاص برابط"]),
        optionA: z.string().trim().min(1).max(80),
        optionB: z.string().trim().min(1).max(80),
      }))
      .mutation(async ({ input }) => {
        const rows = await supabaseRequest<any[]>("decisions", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            guest_id: input.guestId,
            title: input.title,
            description: input.description,
            category: input.category,
            privacy: input.privacy,
            option_a: input.optionA,
            option_b: input.optionB,
          }),
        });
        return mapDecision(rows[0]);
      }),
    vote: publicProcedure
      .input(z.object({
        decisionId: uuid,
        guestId,
        choice: z.enum(["a", "b"]),
        experienceRelation: z.string().max(60).optional(),
      }))
      .mutation(async ({ input }) => {
        const rows = await supabaseRequest<any[]>("votes", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=representation" },
          body: JSON.stringify({
            decision_id: input.decisionId,
            guest_id: input.guestId,
            choice: input.choice,
            experience_relation: input.experienceRelation ?? null,
          }),
        });
        return rows[0] ?? { success: true };
      }),
    addExperience: publicProcedure
      .input(z.object({
        decisionId: uuid,
        guestId,
        name: z.string().trim().min(2).max(80).default("ضيف ميزان"),
        age: z.number().int().min(13).max(100).optional(),
        title: z.string().trim().min(5).max(180),
        body: z.string().trim().min(20).max(5000),
        outcome: z.enum(["نجحت", "فشلت", "قريبة منها", "رأي فقط"]),
      }))
      .mutation(async ({ input }) => {
        const rows = await supabaseRequest<any[]>("experiences", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            decision_id: input.decisionId,
            guest_id: input.guestId,
            name: input.name,
            age: input.age ?? null,
            title: input.title,
            body: input.body,
            outcome: input.outcome,
          }),
        });
        return mapExperience(rows[0]);
      }),
  }),
  owner: router({
    overview: adminProcedure.query(async () => {
      const rows = await supabaseRequest<any[]>(`decisions?select=${decisionFields}&order=created_at.desc&limit=100`);
      const experiences = await supabaseRequest<any[]>("experiences?select=id,decision_id,name,title,body,outcome,status,created_at&order=created_at.desc&limit=100");
      return { decisions: rows.map(mapDecision), experiences: experiences.map(mapExperience) };
    }),
    updateDecision: adminProcedure
      .input(z.object({
        id: uuid,
        title: z.string().trim().min(8).max(180).optional(),
        description: z.string().trim().max(3000).optional(),
        category: z.string().trim().min(2).max(60).optional(),
        optionA: z.string().trim().min(1).max(80).optional(),
        optionB: z.string().trim().min(1).max(80).optional(),
        status: z.enum(["active", "hidden", "archived"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const patch = Object.fromEntries(Object.entries({
          title: rest.title,
          description: rest.description,
          category: rest.category,
          option_a: rest.optionA,
          option_b: rest.optionB,
          status: rest.status,
          updated_at: new Date().toISOString(),
        }).filter(([, value]) => value !== undefined));
        const rows = await supabaseRequest<any[]>(`decisions?id=eq.${id}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(patch),
        });
        return rows[0] ? mapDecision(rows[0]) : null;
      }),
    deleteDecision: adminProcedure
      .input(z.object({ id: uuid }))
      .mutation(async ({ input }) => {
        await supabaseRequest(`decisions?id=eq.${input.id}`, { method: "DELETE" });
        return { success: true } as const;
      }),
    updateExperience: adminProcedure
      .input(z.object({
        id: uuid,
        title: z.string().trim().min(5).max(180).optional(),
        body: z.string().trim().min(20).max(5000).optional(),
        outcome: z.enum(["نجحت", "فشلت", "قريبة منها", "رأي فقط"]).optional(),
        status: z.enum(["active", "hidden", "archived"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...rest } = input;
        const patch = Object.fromEntries(Object.entries({ ...rest, updated_at: new Date().toISOString() }).filter(([, value]) => value !== undefined));
        const rows = await supabaseRequest<any[]>(`experiences?id=eq.${id}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(patch),
        });
        return rows[0] ? mapExperience(rows[0]) : null;
      }),
    deleteExperience: adminProcedure
      .input(z.object({ id: uuid }))
      .mutation(async ({ input }) => {
        await supabaseRequest(`experiences?id=eq.${input.id}`, { method: "DELETE" });
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
