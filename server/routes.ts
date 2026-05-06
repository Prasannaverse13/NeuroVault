import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import {
  insertAgentSchema,
  insertMemorySchema,
  insertAuditLogSchema,
  orchestratorRequestSchema,
  createAgentRequestSchema,
} from "@shared/schema";
import { encrypt, decrypt } from "./lib/encryption";
import { uploadMemory, retrieveMemory, storageStatus } from "./lib/zeroGStorage";
import { computeStatus, executeInference } from "./lib/zeroGCompute";
import { embed } from "./lib/embeddings";
import { contractStatus, fetchOnchainAgent, txExplorerUrl, activeChain } from "./lib/contract";
import { orchestrate } from "./orchestrator";
import { runPrivacyAgent } from "./agents";

const walletConnectSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  workspaceName: z.string().optional(),
});

const handle = (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response) => {
    try {
      const result = await fn(req, res);
      if (!res.headersSent) res.json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: "validation_error", issues: err.issues });
      } else {
        console.error("[route]", err);
        res.status(500).json({ error: err.message ?? "internal_error" });
      }
    }
  };

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ── /api/wallet ────────────────────────────────────────────
  app.post("/api/wallet/connect", handle(async (req) => {
    const { wallet, workspaceName } = walletConnectSchema.parse(req.body);
    const workspace = await storage.getOrCreateWorkspaceByWallet(wallet, workspaceName);
    await storage.appendAudit({
      workspaceId: workspace.id,
      actorWallet: wallet,
      action: "wallet.connect",
      targetType: "workspace",
      targetId: workspace.id,
      metadata: null,
    });
    return { workspace };
  }));

  app.get("/api/wallet/:address", handle(async (req) => {
    const ws = await storage.getWorkspaceByWallet(req.params.address);
    if (!ws) return { workspace: null };
    return { workspace: ws };
  }));

  // ── /api/workspaces ────────────────────────────────────────
  app.get("/api/workspaces/:id", handle(async (req) => {
    const ws = await storage.getWorkspace(req.params.id);
    if (!ws) throw Object.assign(new Error("workspace_not_found"), { status: 404 });
    return { workspace: ws };
  }));

  app.get("/api/workspaces/:id/audit", handle(async (req) =>
    ({ entries: await storage.listAudit(req.params.id) })
  ));

  // ── /api/agents ────────────────────────────────────────────
  app.get("/api/agents", handle(async (req) => {
    const workspaceId = String(req.query.workspaceId ?? "");
    if (!workspaceId) throw new Error("workspaceId query param required");
    const agents = await storage.listAgents(workspaceId);
    return { agents };
  }));

  app.post("/api/agents", handle(async (req) => {
    const input = createAgentRequestSchema.parse(req.body);
    const agent = await storage.createAgent({
      workspaceId: input.workspaceId,
      ownerWallet: input.ownerWallet,
      name: input.name,
      role: input.role,
      memorySize: input.initialMemorySize ?? 0,
    });
    await storage.appendAudit({
      workspaceId: input.workspaceId,
      actorWallet: input.ownerWallet,
      action: "agent.create",
      targetType: "agent",
      targetId: agent.id,
      metadata: { name: agent.name, role: agent.role },
    });
    return { agent };
  }));

  app.get("/api/agents/:id", handle(async (req) => {
    const a = await storage.getAgent(req.params.id);
    if (!a) throw Object.assign(new Error("agent_not_found"), { status: 404 });
    const onchain = a.onchainAgentId ? await fetchOnchainAgent(a.onchainAgentId) : null;
    return { agent: a, onchain };
  }));

  app.post("/api/agents/:id/onchain", handle(async (req) => {
    const schema = z.object({ onchainAgentId: z.string(), txHash: z.string(), contractAddress: z.string() });
    const { onchainAgentId, txHash, contractAddress } = schema.parse(req.body);
    await storage.setAgentOnchain(
      req.params.id,
      onchainAgentId,
      txHash,
      contractAddress,
      txExplorerUrl(txHash),
    );
    return { ok: true, explorerUrl: txExplorerUrl(txHash) };
  }));

  // ── /api/memory ────────────────────────────────────────────
  app.get("/api/memory", handle(async (req) => {
    const workspaceId = String(req.query.workspaceId ?? "");
    if (!workspaceId) throw new Error("workspaceId query param required");
    const memories = await storage.listWorkspaceMemories(workspaceId);
    return { memories };
  }));

  app.post("/api/memory", handle(async (req) => {
    const schema = z.object({
      workspaceId: z.string(),
      agentId: z.string(),
      type: z.string(),
      tags: z.array(z.string()).default([]),
      summary: z.string(),
      payload: z.string(),
    });
    const input = schema.parse(req.body);
    const sanitized = await runPrivacyAgent({ text: input.payload, enforceRedaction: true });
    const cipher = encrypt((sanitized.output as any).sanitizedText);
    const embedding = embed(input.summary + " " + input.payload);

    const memory = await storage.createMemory({
      workspaceId: input.workspaceId,
      agentId: input.agentId,
      type: input.type,
      tags: input.tags,
      summary: input.summary,
      encryptedPayload: cipher,
      storageRef: null,
      embedding: embedding as any,
    });

    const upload = await uploadMemory({
      memoryId: memory.id,
      agentId: memory.agentId,
      workspaceId: memory.workspaceId,
      type: memory.type,
      tags: memory.tags,
      summary: memory.summary,
      encryptedPayload: cipher,
      timestamp: memory.createdAt.toISOString(),
    });
    await storage.setMemoryStorageRef(memory.id, upload.storageRef);

    await storage.appendAudit({
      workspaceId: input.workspaceId,
      actorWallet: "system",
      action: "memory.create",
      targetType: "memory",
      targetId: memory.id,
      metadata: { storageBackend: upload.backend, ref: upload.storageRef },
    });

    return { memory: { ...memory, storageRef: upload.storageRef }, storage: upload };
  }));

  app.get("/api/memory/:id", handle(async (req) => {
    const m = await storage.getMemory(req.params.id);
    if (!m) throw Object.assign(new Error("memory_not_found"), { status: 404 });
    let decrypted: string | null = null;
    try { decrypted = decrypt(m.encryptedPayload); } catch { /* ignore */ }
    const remote = m.storageRef ? await retrieveMemory(m.storageRef) : null;
    return { memory: m, decryptedPayload: decrypted, remoteCopy: remote };
  }));

  // ── /api/storage ───────────────────────────────────────────
  app.get("/api/storage/status", handle(async () => storageStatus()));

  app.get("/api/storage/ref/:ref", handle(async (req) => {
    const memory = await retrieveMemory(decodeURIComponent(req.params.ref));
    return { memory };
  }));

  // ── /api/privacy ───────────────────────────────────────────
  app.post("/api/privacy/scan", handle(async (req) => {
    const schema = z.object({ text: z.string(), enforceRedaction: z.boolean().optional() });
    const input = schema.parse(req.body);
    const result = await runPrivacyAgent(input);
    return result;
  }));

  // ── /api/orchestrator ──────────────────────────────────────
  app.post("/api/orchestrator/run", handle(async (req) => {
    const input = orchestratorRequestSchema.parse(req.body);
    const ws = await storage.getWorkspace(input.workspaceId);
    if (!ws) throw Object.assign(new Error("workspace_not_found"), { status: 404 });
    const memories = await storage.listWorkspaceMemories(input.workspaceId);
    const workflow = await orchestrate({
      workspaceId: input.workspaceId,
      query: input.query,
      memories,
      usage: { apiCalls: 1, storageGb: 0.1, vectorQueries: memories.length },
      agentRouting: input.agentRouting,
    });
    await storage.appendAudit({
      workspaceId: input.workspaceId,
      actorWallet: ws.ownerWallet,
      action: "orchestrator.run",
      targetType: "query",
      targetId: workflow.inferenceJobId,
      metadata: { routedTo: workflow.routedTo, latencyMs: workflow.totalLatencyMs },
    });
    return { workflow };
  }));

  // ── /api/contracts ─────────────────────────────────────────
  app.get("/api/contracts/status", handle(async () => {
    const status = await contractStatus();
    return { ...status, chain: activeChain };
  }));

  app.get("/api/contracts/agents/:id", handle(async (req) => {
    const onchain = await fetchOnchainAgent(req.params.id);
    return { onchain };
  }));

  // ── /api/system ────────────────────────────────────────────
  app.get("/api/system/health", handle(async () => ({
    storage: storageStatus(),
    compute: computeStatus(),
    contract: await contractStatus(),
    chain: activeChain,
    timestamp: new Date().toISOString(),
  })));

  return httpServer;
}
