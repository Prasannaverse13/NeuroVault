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
import {
  getRepositories,
  getRecentCommits,
  getRepositoryIssues,
  getPullRequests,
  buildGitHubContext,
} from "./lib/github";
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

// ── Integration connection tester ──────────────────────────────────────────
const testIntegrationConnection = async (
  type: string,
  config: Record<string, string>,
): Promise<{ ok: boolean; message: string }> => {
  try {
    if (type === "slack" && config.webhook_url) {
      const r = await fetch(config.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "✅ NeuroVault integration connected successfully." }),
      });
      return r.ok
        ? { ok: true, message: "Webhook test message sent to Slack" }
        : { ok: false, message: `Slack webhook returned ${r.status}` };
    }

    if (type === "github" && config.access_token) {
      const token = config.access_token.trim();
      // Classic PATs use "token", fine-grained use "Bearer" — try token first, fallback to Bearer
      const authHeader = token.startsWith("github_pat_") ? `Bearer ${token}` : `token ${token}`;
      const r = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: authHeader,
          "User-Agent": "NeuroVault-Enterprise/1.0",
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      if (r.ok) {
        const data = (await r.json()) as any;
        return { ok: true, message: `Connected as @${data.login}${data.name ? ` (${data.name})` : ""}` };
      }
      const body = await r.json().catch(() => ({})) as any;
      return { ok: false, message: `GitHub ${r.status}: ${body?.message ?? "check your token"}` };
    }

    if (type === "notion" && config.api_key) {
      const r = await fetch("https://api.notion.com/v1/users/me", {
        headers: {
          Authorization: `Bearer ${config.api_key}`,
          "Notion-Version": "2022-06-28",
        },
      });
      if (r.ok) {
        const data = (await r.json()) as any;
        return { ok: true, message: `Connected as ${data.name ?? "Notion user"}` };
      }
      return { ok: false, message: `Notion returned ${r.status} — check your integration token` };
    }

    if (type === "linear" && config.api_key) {
      const r = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          Authorization: config.api_key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "{ viewer { name email } }" }),
      });
      if (r.ok) {
        const data = (await r.json()) as any;
        const name = data.data?.viewer?.name ?? "Linear user";
        return { ok: true, message: `Connected as ${name}` };
      }
      return { ok: false, message: `Linear returned ${r.status} — check your API key` };
    }

    if (type === "openai" && config.api_key) {
      const r = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${config.api_key}` },
      });
      return r.ok
        ? { ok: true, message: "OpenAI API key is valid" }
        : { ok: false, message: `OpenAI returned ${r.status} — check your key` };
    }

    if (type === "hubspot" && config.api_key) {
      const r = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
        headers: { Authorization: `Bearer ${config.api_key}` },
      });
      return r.ok
        ? { ok: true, message: "HubSpot connection verified" }
        : { ok: false, message: `HubSpot returned ${r.status} — check your access token` };
    }

    if (type === "stripe" && config.secret_key) {
      const r = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${config.secret_key}` },
      });
      return r.ok
        ? { ok: true, message: "Stripe connection verified" }
        : { ok: false, message: `Stripe returned ${r.status} — check your secret key` };
    }

    if (type === "airtable" && config.api_key) {
      const r = await fetch("https://api.airtable.com/v0/meta/whoami", {
        headers: { Authorization: `Bearer ${config.api_key}` },
      });
      if (r.ok) {
        const data = (await r.json()) as any;
        return { ok: true, message: `Connected as ${data.email ?? "Airtable user"}` };
      }
      return { ok: false, message: `Airtable returned ${r.status} — check your token` };
    }

    // For integrations without specific tests, verify required fields are present
    const requiredFields = getRequiredFields(type);
    const missingFields = requiredFields.filter((f) => !config[f]);
    if (missingFields.length > 0) {
      return { ok: false, message: `Missing required fields: ${missingFields.join(", ")}` };
    }

    return { ok: true, message: "Credentials saved and connection recorded" };
  } catch (err: any) {
    return { ok: false, message: err.message ?? "Connection test failed" };
  }
};

const getRequiredFields = (type: string): string[] => {
  const map: Record<string, string[]> = {
    slack: ["webhook_url"],
    github: ["access_token"],
    notion: ["api_key"],
    linear: ["api_key"],
    hubspot: ["api_key"],
    stripe: ["secret_key"],
    zendesk: ["subdomain", "api_token"],
    openai: ["api_key"],
    salesforce: ["instance_url", "access_token"],
    airtable: ["api_key"],
    postgres: ["connection_string"],
    snowflake: ["account", "username", "password"],
  };
  return map[type] ?? [];
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
    const integrations = await storage.listIntegrations(workspaceId);
    const storeSt = storageStatus();
    const contractSt = await contractStatus();
    return {
      agentCount: agents.length,
      memoryCount: memories.length,
      auditCount: auditEntries.length,
      integrationCount: integrations.filter((i) => i.status === "connected").length,
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
      metadata: { name: agent.name, role: agent.role, source: input.source ?? "manual", marketplaceId: input.marketplaceId ?? null },
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

    const sanitized = await runPrivacyAgent({ text: input.payload, enforceRedaction: true });
    const cleanPayload = (sanitized.output as any).sanitizedText as string;

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
    const integrations = await storage.listIntegrations(workspaceId);
    const connectedIntegrations = integrations.filter((i) => i.status === "connected");

    // ── GitHub live context injection ──────────────────────────
    const ghIntegration = connectedIntegrations.find((i) => i.type === "github");
    const isGithubQuery = /repo|repositor|commit|issue|pull\s*request|pr|branch|git|github|code|push|merge/i.test(message);
    let githubContext: string | undefined;
    let githubDataUsed = false;

    if (ghIntegration?.config?.access_token) {
      try {
        // Always inject GitHub context for GitHub-related queries; also inject repo list for generic queries
        const token = ghIntegration.config.access_token as string;
        const pinnedRepo = ghIntegration.config.repo as string | undefined;
        githubContext = await buildGitHubContext(token, pinnedRepo || undefined);
        githubDataUsed = true;
      } catch (err) {
        console.warn("[copilot] GitHub context fetch failed:", err);
        githubContext = `GitHub integration connected but data fetch failed: ${(err as Error).message}`;
      }
    }

    const integrationLines: string[] = [];
    if (connectedIntegrations.length > 0) {
      integrationLines.push(`Connected integrations: ${connectedIntegrations.map((i) => i.name).join(", ")}`);
    }
    if (githubContext) {
      integrationLines.push(`\n--- LIVE GITHUB DATA ---\n${githubContext}\n--- END GITHUB DATA ---`);
    }

    const workflow = await orchestrate({
      workspaceId,
      query: message,
      memories: allMemories,
      usage: { apiCalls: history.length + 1, storageGb: allMemories.length * 0.001, vectorQueries: allMemories.length },
      chatHistory: history,
      integrationContext: integrationLines.length > 0 ? integrationLines.join("\n") : undefined,
    });

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
      githubDataUsed,
    };
  }));

  // ── /api/github ─────────────────────────────────────────────
  const requireGithubToken = async (workspaceId: string) => {
    const integration = await storage.getIntegrationByType(workspaceId, "github");
    if (!integration) throw Object.assign(new Error("GitHub not connected. Connect GitHub from the Integrations page first."), { status: 404 });
    const token = integration.config?.access_token as string | undefined;
    if (!token) throw Object.assign(new Error("GitHub token missing in integration config"), { status: 400 });
    return { token, repo: integration.config?.repo as string | undefined };
  };

  app.get("/api/github/repos", handle(async (req) => {
    const workspaceId = String(req.query.workspaceId ?? "");
    if (!workspaceId) throw new Error("workspaceId required");
    const { token } = await requireGithubToken(workspaceId);
    const repos = await getRepositories(token);
    return { repos, total: repos.length, fetchedAt: new Date().toISOString() };
  }));

  app.get("/api/github/commits", handle(async (req) => {
    const workspaceId = String(req.query.workspaceId ?? "");
    const repo = String(req.query.repo ?? "");
    if (!workspaceId || !repo) throw new Error("workspaceId and repo required");
    const { token } = await requireGithubToken(workspaceId);
    const commits = await getRecentCommits(token, repo, 20);
    return { commits, repo, fetchedAt: new Date().toISOString() };
  }));

  app.get("/api/github/issues", handle(async (req) => {
    const workspaceId = String(req.query.workspaceId ?? "");
    const repo = String(req.query.repo ?? "");
    const state = (req.query.state as "open" | "closed" | "all") ?? "open";
    if (!workspaceId || !repo) throw new Error("workspaceId and repo required");
    const { token } = await requireGithubToken(workspaceId);
    const issues = await getRepositoryIssues(token, repo, { state, limit: 30 });
    return { issues, repo, state, fetchedAt: new Date().toISOString() };
  }));

  app.get("/api/github/pulls", handle(async (req) => {
    const workspaceId = String(req.query.workspaceId ?? "");
    const repo = String(req.query.repo ?? "");
    const state = (req.query.state as "open" | "closed" | "all") ?? "open";
    if (!workspaceId || !repo) throw new Error("workspaceId and repo required");
    const { token } = await requireGithubToken(workspaceId);
    const pulls = await getPullRequests(token, repo, { state, limit: 30 });
    return { pulls, repo, state, fetchedAt: new Date().toISOString() };
  }));

  // Sync GitHub repos + recent activity into workspace memory
  app.post("/api/github/sync", handle(async (req) => {
    const { workspaceId } = z.object({ workspaceId: z.string() }).parse(req.body);
    const ws = await storage.getWorkspace(workspaceId);
    if (!ws) throw Object.assign(new Error("workspace_not_found"), { status: 404 });
    const { token, repo: pinnedRepo } = await requireGithubToken(workspaceId);

    const repos = await getRepositories(token, { perPage: 30, sort: "updated" });
    const agents = await storage.listAgents(workspaceId);
    const agentId = agents[0]?.id ?? workspaceId;
    let memoriesCreated = 0;
    const syncedRepos: string[] = [];

    for (const repo of repos.slice(0, 10)) {
      try {
        const [commits, issues, prs] = await Promise.all([
          getRecentCommits(token, repo.fullName, 5),
          getRepositoryIssues(token, repo.fullName, { state: "open", limit: 5 }),
          getPullRequests(token, repo.fullName, { state: "open", limit: 5 }),
        ]);

        const summary = [
          `GitHub repo: ${repo.fullName}`,
          repo.description ? `Description: ${repo.description}` : "",
          `Language: ${repo.language ?? "unknown"} | Stars: ${repo.stargazersCount} | Open issues: ${repo.openIssuesCount}`,
          commits.length > 0 ? `Recent commits: ${commits.map((c) => `${c.sha} ${c.message}`).join("; ")}` : "",
          issues.length > 0 ? `Open issues: ${issues.map((i) => `#${i.number} ${i.title}`).join("; ")}` : "",
          prs.length > 0 ? `Open PRs: ${prs.map((p) => `#${p.number} ${p.title}`).join("; ")}` : "",
        ].filter(Boolean).join("\n");

        const { encrypt: enc } = await import("./lib/encryption");
        await storage.createMemory({
          workspaceId,
          agentId,
          type: "GitHub",
          tags: ["github", "repository", repo.language?.toLowerCase() ?? "code"].filter(Boolean),
          summary: `GitHub: ${repo.fullName} — ${repo.openIssuesCount} issues, ${commits.length} recent commits`,
          encryptedPayload: enc(summary),
          storageRef: null,
          embedding: null,
        });
        memoriesCreated++;
        syncedRepos.push(repo.fullName);
      } catch {
        // skip failing repos
      }
    }

    await storage.appendAudit({
      workspaceId,
      actorWallet: ws.ownerWallet,
      action: "github.sync",
      targetType: "integration",
      metadata: { repoCount: repos.length, memoriesCreated },
    });

    return { synced: repos.length, memoriesCreated, repos: syncedRepos };
  }));

  // ── /api/integrations ──────────────────────────────────────
  app.get("/api/integrations", handle(async (req) => {
    const workspaceId = String(req.query.workspaceId ?? "");
    if (!workspaceId) throw new Error("workspaceId query param required");
    const integrations = await storage.listIntegrations(workspaceId);
    return { integrations };
  }));

  app.post("/api/integrations", handle(async (req) => {
    const schema = z.object({
      workspaceId: z.string(),
      type: z.string().min(1),
      name: z.string().min(1),
      category: z.string().min(1),
      config: z.record(z.string()).default({}),
    });
    const input = schema.parse(req.body);

    const ws = await storage.getWorkspace(input.workspaceId);
    if (!ws) throw Object.assign(new Error("workspace_not_found"), { status: 404 });

    // Remove any existing integration of this type for this workspace
    const existing = await storage.getIntegrationByType(input.workspaceId, input.type);
    if (existing) await storage.deleteIntegration(existing.id);

    // Test the connection
    const testResult = await testIntegrationConnection(input.type, input.config);

    const integration = await storage.createIntegration({
      workspaceId: input.workspaceId,
      type: input.type,
      name: input.name,
      category: input.category,
      config: input.config,
      status: testResult.ok ? "connected" : "error",
      statusMessage: testResult.message,
      testedAt: new Date(),
    });

    await storage.appendAudit({
      workspaceId: input.workspaceId,
      actorWallet: ws.ownerWallet,
      action: testResult.ok ? "integration.connect" : "integration.connect_failed",
      targetType: "integration",
      targetId: integration.id,
      metadata: { type: input.type, name: input.name, testResult },
    });

    return { integration, testResult };
  }));

  app.post("/api/integrations/:id/test", handle(async (req) => {
    const integration = await storage.getIntegration(req.params.id);
    if (!integration) throw Object.assign(new Error("integration_not_found"), { status: 404 });

    const testResult = await testIntegrationConnection(integration.type, integration.config);
    const updated = await storage.updateIntegration(integration.id, {
      status: testResult.ok ? "connected" : "error",
      statusMessage: testResult.message,
      testedAt: new Date(),
    });

    return { integration: updated, testResult };
  }));

  app.delete("/api/integrations/:id", handle(async (req) => {
    const integration = await storage.getIntegration(req.params.id);
    if (!integration) throw Object.assign(new Error("integration_not_found"), { status: 404 });
    await storage.deleteIntegration(req.params.id);
    return { ok: true };
  }));

  // Integration context for agents
  app.get("/api/integrations/context/:workspaceId", handle(async (req) => {
    const integrations = await storage.listIntegrations(req.params.workspaceId);
    const connected = integrations.filter((i) => i.status === "connected");
    return {
      connected: connected.map((i) => ({
        type: i.type,
        name: i.name,
        category: i.category,
        testedAt: i.testedAt,
        statusMessage: i.statusMessage,
        // Never expose raw config/secrets to frontend
      })),
      count: connected.length,
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

  // Deploy AgentRegistry contract on-demand
  app.post("/api/contracts/deploy", handle(async () => {
    const pk = process.env.ZG_PRIVATE_KEY;
    if (!pk) {
      throw Object.assign(
        new Error("ZG_PRIVATE_KEY env var not set. Add your funded 0G wallet private key as a secret."),
        { status: 400 },
      );
    }
    const { ethers } = await import("ethers");
    const solc = (await import("solc")).default as any;
    const { readFile, writeFile, mkdir } = await import("node:fs/promises");
    const path = await import("node:path");

    // Compile
    const source = await readFile(path.resolve("contracts/AgentRegistry.sol"), "utf8");
    const input = {
      language: "Solidity",
      sources: { "AgentRegistry.sol": { content: source } },
      settings: {
        optimizer: { enabled: true, runs: 200 },
        outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
      },
    };
    const out = JSON.parse(solc.compile(JSON.stringify(input)));
    if (out.errors?.some((e: any) => e.severity === "error")) {
      throw new Error("Solidity compilation failed: " + JSON.stringify(out.errors));
    }
    const c = out.contracts["AgentRegistry.sol"]["AgentRegistry"];
    const bytecode = "0x" + c.evm.bytecode.object;
    const abi = c.abi;

    const provider = new ethers.JsonRpcProvider(activeChain.rpcUrl);
    const wallet = new ethers.Wallet(pk, provider);
    const balance = await provider.getBalance(wallet.address);
    if (balance === 0n) {
      throw Object.assign(
        new Error(`Wallet ${wallet.address} has 0 balance on ${activeChain.name}. Fund it from the faucet first.`),
        { status: 402 },
      );
    }

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy();
    const txHash = contract.deploymentTransaction()?.hash ?? "";
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    const explorerUrl = `${activeChain.explorer}/address/${address}`;
    const txUrl = `${activeChain.explorer}/tx/${txHash}`;

    // Persist deployment
    await mkdir("contracts", { recursive: true });
    const file = path.resolve("contracts/deployments.json");
    let json: any = {};
    try { json = JSON.parse(await readFile(file, "utf8")); } catch { /* new */ }
    json[process.env.ZG_CHAIN || "0g-galileo"] = { AgentRegistry: address, txHash, explorerUrl, deployedAt: new Date().toISOString() };
    await writeFile(file, JSON.stringify(json, null, 2));

    await storage.upsertContractMeta({
      name: "AgentRegistry",
      address,
      chainId: activeChain.chainId,
      deployTxHash: txHash,
      explorerUrl,
    });

    return { address, txHash, explorerUrl, txUrl, chain: activeChain.name };
  }));

  // ── /api/system ────────────────────────────────────────────
  app.get("/api/system/health", handle(async () => {
    let deployWallet: string | null = null;
    if (process.env.ZG_PRIVATE_KEY) {
      try {
        const { ethers } = await import("ethers");
        deployWallet = new ethers.Wallet(process.env.ZG_PRIVATE_KEY).address;
      } catch { /* ignore */ }
    }
    return {
      storage: storageStatus(),
      compute: computeStatus(),
      contract: await contractStatus(),
      chain: activeChain,
      gemini: { configured: isGeminiConfigured() },
      deployWallet,
      timestamp: new Date().toISOString(),
    };
  }));

  return httpServer;
}
