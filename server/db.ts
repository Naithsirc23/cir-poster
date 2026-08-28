import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { drafts, InsertDraft, InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listDrafts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(drafts).where(eq(drafts.userId, userId)).orderBy(desc(drafts.updatedAt));
}

export async function createDraft(input: InsertDraft) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(drafts).values(input);
  const insertId = Number((result as unknown as { insertId: number }).insertId);
  const created = await db.select().from(drafts).where(and(eq(drafts.id, insertId), eq(drafts.userId, input.userId))).limit(1);
  return created[0];
}

export async function updateDraft(draftId: number, userId: number, patch: Partial<InsertDraft>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(drafts).set(patch).where(and(eq(drafts.id, draftId), eq(drafts.userId, userId)));
  const updated = await db.select().from(drafts).where(and(eq(drafts.id, draftId), eq(drafts.userId, userId))).limit(1);
  return updated[0];
}

export async function duplicateDraft(draftId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const source = await db.select().from(drafts).where(and(eq(drafts.id, draftId), eq(drafts.userId, userId))).limit(1);
  if (!source[0]) return undefined;
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...copy } = source[0];
  return createDraft({ ...copy, userId, title: `${copy.title} · copia`, status: "draft" });
}
