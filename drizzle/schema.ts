import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const drafts = mysqlTable("content_drafts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  idea: text("idea").notNull(),
  channel: varchar("channel", { length: 40 }).notNull().default("linkedin"),
  format: varchar("format", { length: 40 }).notNull().default("post"),
  objective: varchar("objective", { length: 120 }).notNull(),
  audience: varchar("audience", { length: 180 }).notNull(),
  tone: varchar("tone", { length: 80 }).notNull(),
  coreMessage: text("coreMessage").notNull(),
  callToAction: varchar("callToAction", { length: 220 }).notNull(),
  content: text("content").notNull(),
  slides: text("slides"),
  status: mysqlEnum("status", ["draft", "ready", "archived"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Draft = typeof drafts.$inferSelect;
export type InsertDraft = typeof drafts.$inferInsert;
