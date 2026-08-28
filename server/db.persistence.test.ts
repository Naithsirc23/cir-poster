import { beforeEach, describe, expect, it, vi } from "vitest";

const fakeDb = vi.hoisted(() => {
  const rows = [{ id: 3, userId: 7, title: "Idea", content: "Texto", status: "draft" }];
  const select = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn().mockResolvedValue(rows),
        limit: vi.fn().mockResolvedValue(rows),
      })),
    })),
  }));
  const insert = vi.fn(() => ({ values: vi.fn((input) => { rows[0] = { ...rows[0], ...input }; return Promise.resolve({ insertId: 3 }); }) }));
  const update = vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({ affectedRows: 1 }) })) }));
  return { rows, select, insert, update };
});

vi.mock("drizzle-orm/mysql2", () => ({ drizzle: vi.fn(() => fakeDb) }));

import { createDraft, duplicateDraft, getDb, listDrafts, updateDraft } from "./db";

const draft = {
  userId: 7,
  title: "Idea",
  idea: "Una idea con suficiente contexto.",
  channel: "linkedin",
  format: "post",
  objective: "Compartir una idea",
  audience: "Builders",
  tone: "Claro",
  coreMessage: "Una idea central.",
  callToAction: "¿Qué opinas?",
  content: "Texto listo para editar.",
  status: "draft" as const,
};

describe("draft persistence", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "mysql://test";
    vi.clearAllMocks();
  });

  it("connects lazily and creates a draft", async () => {
    expect(await getDb()).toBe(fakeDb);
    const result = await createDraft(draft);
    expect(fakeDb.insert).toHaveBeenCalledOnce();
    expect(result?.id).toBe(3);
  });

  it("lists drafts through the user-scoped query", async () => {
    const result = await listDrafts(7);
    expect(fakeDb.select).toHaveBeenCalled();
    expect(result).toEqual(fakeDb.rows);
  });

  it("updates and duplicates an existing draft", async () => {
    const updated = await updateDraft(3, 7, { title: "Idea actualizada" });
    const copied = await duplicateDraft(3, 7);
    expect(fakeDb.update).toHaveBeenCalledOnce();
    expect(updated?.id).toBe(3);
    expect(copied?.title).toBe("Idea · copia");
  });
});
