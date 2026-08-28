import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { createDraft, duplicateDraft, listDrafts, updateDraft } from "./db";
import { invokeLLM } from "./_core/llm";

vi.mock("./db", () => ({
  createDraft: vi.fn(),
  duplicateDraft: vi.fn(),
  listDrafts: vi.fn(),
  updateDraft: vi.fn(),
}));

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

const ctx = {
  user: { id: 7, openId: "content-user", name: "Cristhian", email: "business.cir.pe@gmail.com", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {} as never,
  res: {} as never,
};

const brief = {
  idea: "Quiero contar una idea sobre construir con IA.",
  channel: "linkedin" as const,
  format: "post" as const,
  objective: "Compartir una idea",
  audience: "Builders y equipos de producto",
  tone: "Claro y reflexivo",
  coreMessage: "La IA acelera, el criterio orienta.",
  callToAction: "¿Qué estás construyendo?",
};

describe("content router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("generates a structured draft through the server-side LLM", async () => {
    const generated = { title: "Construir con IA", hook: "La velocidad no reemplaza el criterio.", body: "Un cuerpo de post.", callToAction: "¿Qué estás construyendo?", hashtags: ["#IA"], structure: ["Hook", "Idea", "CTA"] };
    vi.mocked(invokeLLM).mockResolvedValue({ choices: [{ message: { content: JSON.stringify(generated) } }] } as never);
    const result = await appRouter.createCaller(ctx).content.generate(brief);
    expect(result.title).toBe("Construir con IA");
    expect(invokeLLM).toHaveBeenCalledOnce();
  });

  it("scopes draft operations to the authenticated user", async () => {
    vi.mocked(createDraft).mockResolvedValue({ id: 10, userId: 7, ...brief, title: "Idea", content: "Texto", status: "draft", createdAt: new Date(), updatedAt: new Date() } as never);
    vi.mocked(listDrafts).mockResolvedValue([]);
    vi.mocked(duplicateDraft).mockResolvedValue(undefined);
    vi.mocked(updateDraft).mockResolvedValue(undefined);

    await appRouter.createCaller(ctx).content.createDraft({ ...brief, title: "Idea", content: "Texto" });
    await appRouter.createCaller(ctx).content.listDrafts();
    await appRouter.createCaller(ctx).content.duplicateDraft({ id: 10 });
    await appRouter.createCaller(ctx).content.archiveDraft({ id: 10 });

    expect(vi.mocked(createDraft).mock.calls[0]?.[0]).toMatchObject({ userId: 7, title: "Idea" });
    expect(listDrafts).toHaveBeenCalledWith(7);
    expect(duplicateDraft).toHaveBeenCalledWith(10, 7);
    expect(updateDraft).toHaveBeenCalledWith(10, 7, { status: "archived" });
  });
});
