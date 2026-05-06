import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerWallet: text("owner_wallet").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  onchainAgentId: text("onchain_agent_id"),
  name: text("name").notNull(),
  role: text("role").notNull(),
  ownerWallet: text("owner_wallet").notNull(),
  memorySize: integer("memory_size").notNull().default(0),
  contractAddress: text("contract_address"),
  txHash: text("tx_hash"),
  explorerUrl: text("explorer_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const memories = pgTable("memories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  agentId: varchar("agent_id").notNull(),
  type: text("type").notNull(),
  tags: text("tags").array().notNull().default(sql`'{}'`),
  summary: text("summary").notNull(),
  encryptedPayload: text("encrypted_payload").notNull(),
  storageRef: text("storage_ref"),
  embedding: jsonb("embedding"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  actorWallet: text("actor_wallet").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contractMeta = pgTable("contract_meta", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  address: text("address").notNull(),
  chainId: integer("chain_id").notNull(),
  deployTxHash: text("deploy_tx_hash"),
  explorerUrl: text("explorer_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ id: true, createdAt: true });
export const insertAgentSchema = createInsertSchema(agents).omit({ id: true, createdAt: true });
export const insertMemorySchema = createInsertSchema(memories).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertContractMetaSchema = createInsertSchema(contractMeta).omit({ id: true, createdAt: true });

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Memory = typeof memories.$inferSelect;
export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type ContractMeta = typeof contractMeta.$inferSelect;
export type InsertContractMeta = z.infer<typeof insertContractMetaSchema>;

export const memoryObjectSchema = z.object({
  memoryId: z.string(),
  agentId: z.string(),
  workspaceId: z.string(),
  type: z.string(),
  tags: z.array(z.string()),
  summary: z.string(),
  encryptedPayload: z.string(),
  timestamp: z.string(),
});
export type MemoryObject = z.infer<typeof memoryObjectSchema>;

export const orchestratorRequestSchema = z.object({
  workspaceId: z.string(),
  query: z.string().min(1),
  agentRouting: z.array(z.enum(["memory", "devops", "privacy", "billing"])).optional(),
});
export type OrchestratorRequest = z.infer<typeof orchestratorRequestSchema>;

export const createAgentRequestSchema = z.object({
  workspaceId: z.string(),
  ownerWallet: z.string(),
  name: z.string().min(1),
  role: z.enum(["devops", "support", "finance", "memory", "privacy"]),
  initialMemorySize: z.number().int().nonnegative().optional(),
});
export type CreateAgentRequest = z.infer<typeof createAgentRequestSchema>;
