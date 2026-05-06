import type { Express, Request, Response } from "express";
import { type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import {
  insertAgentSchema,
  orchestratorRequestSchema,
  createAgentRequestSchema,
} from "@shared/schema";
import { encrypt, decrypt } from "./lib/encryption";
import { uploadMemory, retrieveMemory, storageStatus } from "./lib/zeroGStorage";
import { computeStatus } from "./lib/zeroGCompute";
import { embed } from "./lib/embeddings";
import { contractStatus, fetchOnchainAgent, txExplorerUrl, activeChain } from "./lib/contract";
import { orchestrate } from "./orchestrator";
import { runPrivacyAgent } from "./agents";
import {
  isGeminiConfigured,
  summarizeMemory,
  generateInsights,
  chatWithHistory,
  type ChatMessage,
} from "./lib/gemini";

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

const walletConnectSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  workspaceName: z.string().optional(),
});

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
    return { workspace: ws ?? null };
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

  // ── /api/dashboard/stats ───────────────────────────────────
  app.get("/api/dashboard/stats/:workspaceId", handle(async (req) => {
    const { workspaceId } = req.params;
    const agents = await storage.listAgents(workspaceId);
    const memories = await storage.listWorkspaceMemories(workspaceId);
    const auditEntries = await storage.listAudit(workspaceId, 50);
    const storeSt = storageStatus();
    const contractSt = await contractStatus();
    return {
      agentCount: agents.length,
      memoryCount: memories.length,
      auditCount: auditEntries.length,
      storageBackend: storeSt.backend,
      contractConfigured: contractSt.configured,
      contractAddress: contractSt.address,
      chainName: activeChain.name,
      recentAudit: auditEntries.slice(0, 10),
      agents: agents.slice(0, 5),
    };
  }));

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
    await storage.setAgentOnchain(req.params.id, onchainAgentId, txHash, contractAddress, txExplorerUrl(txHash));
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
      type: z.string().default("general"),
      tags: z.array(z.string()).default([]),
      summary: z.string().optional(),
      payload: z.string(),
    });
    const input = schema.parse(req.body);

    // Privacy scan before processing
    const sanitized = await runPrivacyAgent({ text: input.payload, enforceRedaction: true });
    const cleanPayload = (sanitized.output as any).sanitizedText as string;

    // Gemini-powered summarization + auto-tagging
    let summary = input.summary ?? input.payload.slice(0, 120);
    let tags = input.tags;
    let category = input.type;
    let importance: string = "medium";

    if (isGeminiConfigured()) {
      try {
        const structured = await summarizeMemory(cleanPayload);
        summary = structured.summary;
        tags = structured.tags;
        category = structured.category;
        importance = structured.importance;
      } catch (e) {
        console.warn("[memory] Gemini summarization failed:", e);
      }
    }

    const cipher = encrypt(cleanPayload);
    const embedding = embed(summary + " " + cleanPayload.slice(0, 500));

    const memory = await storage.createMemory({
      workspaceId: input.workspaceId,
      agentId: input.agentId,
      type: category,
      tags,
      summary,
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
      metadata: { storageBackend: upload.backend, ref: upload.storageRef, importance },
    });

    return { memory: { ...memory, storageRef: upload.storageRef }, storage: upload, importance };
  }));

  app.get("/api/memory/:id", handle(async (req) => {
    const m = await storage.getMemory(req.params.id);
    if (!m) throw Object.assign(new Error("memory_not_found"), { status: 404 });
    let decrypted: string | null = null;
    try { decrypted = decrypt(m.encryptedPayload); } catch { /* ignore */ }
    const remote = m.storageRef ? await retrieveMemory(m.storageRef) : null;
    return { memory: m, decryptedPayload: decrypted, remoteCopy: remote };
  }));

  // ── /api/insights ──────────────────────────────────────────
  app.get("/api/insights/:workspaceId", handle(async (req) => {
    const memories = await storage.listWorkspaceMemories(req.params.workspaceId);
    const summaries = memories.map((m) => m.summary);
    const insights = await generateInsights(summaries);
    return { insights, generatedAt: new Date().toISOString(), memoryCount: memories.length };
  }));

  // ── /api/copilot ───────────────────────────────────────────
  app.post("/api/copilot/chat", handle(async (req) => {
    const schema = z.object({
      workspaceId: z.string(),
      message: z.string().min(1),
      history: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).default([]),
    });
    const { workspaceId, message, history } = schema.parse(req.body);

    const ws = await storage.getWorkspace(workspaceId);
    if (!ws) throw Object.assign(new Error("workspace_not_found"), { status: 404 });

    const allMemories = await storage.listWorkspaceMemories(workspaceId);
    const workflow = await orchestrate({
      workspaceId,
      query: message,
      memories: allMemories,
      usage: { apiCalls: history.length + 1, storageGb: allMemories.length * 0.001, vectorQueries: allMemories.length },
      chatHistory: history,
    });

    // Store the conversation as a memory
    if (isGeminiConfigured()) {
      try {
        const agents = await storage.listAgents(workspaceId);
        const agentId = agents[0]?.id ?? workspaceId;
        await storage.createMemory({
          workspaceId,
          agentId,
          type: "Copilot",
          tags: ["copilot", "conversation"],
          summary: `Copilot: "${message.slice(0, 80)}"`,
          encryptedPayload: encrypt(JSON.stringify({ q: message, a: workflow.finalResponse.slice(0, 500) })),
          storageRef: null,
          embedding: embed(message + " " + workflow.finalResponse.slice(0, 200)) as any,
        });
      } catch {
        /* non-critical */
      }
    }

    await storage.appendAudit({
      workspaceId,
      actorWallet: ws.ownerWallet,
      action: "copilot.chat",
      targetType: "query",
      targetId: workflow.inferenceJobId,
      metadata: { latencyMs: workflow.totalLatencyMs, routedTo: workflow.routedTo },
    });

    return {
      response: workflow.finalResponse,
      jobId: workflow.inferenceJobId,
      routedTo: workflow.routedTo,
      latencyMs: workflow.totalLatencyMs,
      memoryCount: allMemories.length,
    };
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
      usage: { apiCalls: 1, storageGb: memories.length * 0.001, vectorQueries: memories.length },
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
    gemini: { configured: isGeminiConfigured() },
    timestamp: new Date().toISOString(),
  })));

  return httpServer;
}
