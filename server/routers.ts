import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createDraft, duplicateDraft, listDrafts, updateDraft } from "./db";

export const contentBriefSchema = z.object({
  idea: z.string().min(8).max(2000),
  channel: z.enum(["linkedin", "facebook", "instagram", "tiktok"]),
  format: z.enum(["post", "carousel", "short-video"]),
  objective: z.string().min(2).max(120),
  audience: z.string().min(2).max(180),
  tone: z.string().min(2).max(80),
  coreMessage: z.string().min(2).max(1200),
  callToAction: z.string().min(2).max(220),
});

const draftInputSchema = contentBriefSchema.extend({
  title: z.string().min(1).max(180),
  content: z.string().min(1).max(12000),
});

export const postOutputParser = z.object({
  title: z.string(),
  hook: z.string(),
  body: z.string(),
  callToAction: z.string(),
  hashtags: z.array(z.string()),
  structure: z.array(z.string()),
});

const postOutputSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    hook: { type: "string" },
    body: { type: "string" },
    callToAction: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
    structure: { type: "array", items: { type: "string" } },
  },
  required: ["title", "hook", "body", "callToAction", "hashtags", "structure"],
  additionalProperties: false,
} as const;

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
    generate: protectedProcedure.input(contentBriefSchema).mutation(async ({ input }) => {
      const response = await invokeLLM({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: "Eres un estratega editorial y copywriter de producto. Crea borradores claros, humanos y específicos. No inventes resultados, clientes, testimonios ni datos que el usuario no haya proporcionado. Devuelve solo JSON válido según el esquema.",
          },
          {
            role: "user",
            content: `Crea un borrador para ${input.channel} en formato ${input.format}.\n\nIdea: ${input.idea}\nObjetivo: ${input.objective}\nAudiencia: ${input.audience}\nTono: ${input.tone}\nMensaje central: ${input.coreMessage}\nCTA: ${input.callToAction}\n\nPara LinkedIn, prioriza una apertura fuerte, párrafos respirables, una perspectiva concreta y una llamada a la conversación. No uses emojis salvo que sean imprescindibles.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "social_post_draft",
            strict: true,
            schema: postOutputSchema,
          },
        },
        reasoning: { effort: "low" },
      });
      const raw = response.choices[0]?.message?.content;
      const content = typeof raw === "string" ? raw : "";
      if (!content) throw new Error("La IA no devolvió contenido utilizable");
      return postOutputParser.parse(JSON.parse(content));
    }),
    listDrafts: protectedProcedure.query(({ ctx }) => listDrafts(ctx.user.id)),
    createDraft: protectedProcedure.input(draftInputSchema).mutation(({ ctx, input }) => createDraft({ ...input, userId: ctx.user.id, status: "draft" })),
    updateDraft: protectedProcedure.input(z.object({ id: z.number().int().positive(), content: z.string().min(1).max(12000), title: z.string().min(1).max(180) })).mutation(({ ctx, input }) => updateDraft(input.id, ctx.user.id, { content: input.content, title: input.title })),
    duplicateDraft: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => duplicateDraft(input.id, ctx.user.id)),
    archiveDraft: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => updateDraft(input.id, ctx.user.id, { status: "archived" })),
  }),
});

export type AppRouter = typeof appRouter;
