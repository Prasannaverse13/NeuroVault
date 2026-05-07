import type { Express, Request, Response, NextFunction } from "express";
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
import { getRepositories, getRecentCommits, getRepositoryIssues, getPullRequests, buildGitHubContext } from "./lib/github";
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

const walletRegex = /^0x[a-fA-F0-9]{40}$/;

const requireWallet = (req: Request, res: Response, next: NextFunction) => {
  const addr = req.headers["x-wallet-address"] as string | undefined;
  if (!addr || !walletRegex.test(addr)) {
    res.status(401).json({ error: "wallet_required", message: "Connect your wallet to access this resource." });
    return;
  }
  next();
};

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
      return r.ok ? { ok: true, message: "Webhook test message sent to Slack" } : { ok: false, message: `Slack webhook returned ${r.status}` };
    }

    if (type === "github" && config.access_token) {
      const token = config.access_token.trim();
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

    return { ok: true, message: `${type} configured` };
  } catch (err: any) {
    return { ok: false, message: err.message ?? "connection failed" };
  }
};

export function registerRoutes(app: Express, httpServer: Server) {
  app.post("/api/wallet/connect", handle(async (req) => {
    const { wallet, workspaceName } = walletConnectSchema.parse(req.body);
    const workspace = await storage.getOrCreateWorkspaceByWallet(wallet, workspaceName);
    return { workspace };
  }));

  app.get("/api/system/health", handle(async () => {
    let deployWallet: string | null = null;
    if (process.env.ZG_PRIVATE_KEY) {
      try {
        const { ethers } = await import("ethers");
        deployWallet = new ethers.Wallet(process.env.ZG_PRIVATE_KEY).address;
      } catch { }
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

  app.post("/api/copilot/chat", requireWallet, handle(async (req) => {
    const schema = z.object({
      workspaceId: z.string(),
      message: z.string().min(1),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).default([]),
    });
    const { workspaceId, message, history } = schema.parse(req.body);

    const ws = await storage.getWorkspace(workspaceId);
    if (!ws) throw Object.assign(new Error("workspace_not_found"), { status: 404 });

    const allMemories = await storage.listWorkspaceMemories(workspaceId);
    const integrations = await storage.listIntegrations(workspaceId);
    const connectedIntegrations = integrations.filter((i) => i.status === "connected");
    const ghIntegration = connectedIntegrations.find((i) => i.type === "github");

    let githubContext: string | undefined;
    let githubDataUsed = false;
    if (ghIntegration?.config?.access_token) {
      try {
        githubContext = await buildGitHubContext(ghIntegration.config.access_token as string, ghIntegration.config.repo as string | undefined);
        githubDataUsed = true;
      } catch (err) {
        console.warn("[copilot] GitHub context fetch failed:", err);
        githubContext = `GitHub integration connected but data fetch failed: ${(err as Error).message}`;
      }
    }

    const integrationLines: string[] = [];
    if (connectedIntegrations.length > 0) integrationLines.push(`Connected integrations: ${connectedIntegrations.map((i) => i.name).join(", ")}`);
    if (githubContext) integrationLines.push(`\n--- LIVE GITHUB DATA ---\n${githubContext}\n--- END GITHUB DATA ---`);

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
      } catch { }
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

  const requireGithubToken = async (workspaceId: string) => {
    const integration = await storage.getIntegrationByType(workspaceId, "github");
    if (!integration) throw Object.assign(new Error("GitHub not connected. Connect GitHub from the Integrations page first."), { status: 404 });
    const token = integration.config?.access_token as string | undefined;
    if (!token) throw Object.assign(new Error("GitHub token missing in integration config"), { status: 400 });
    return { token, repo: integration.config?.repo as string | undefined };
  };

  app.get("/api/github/repos", requireWallet, handle(async (req) => {
    const workspaceId = String(req.query.workspaceId ?? "");
    if (!workspaceId) throw new Error("workspaceId required");
    const { token } = await requireGithubToken(workspaceId);
    const repos = await getRepositories(token);
    return { repos, total: repos.length, fetchedAt: new Date().toISOString() };
  }));

  app.get("/api/github/commits", requireWallet, handle(async (req) => {
    const workspaceId = String(req.query.workspaceId ?? "");
    const repo = String(req.query.repo ?? "");
    if (!workspaceId || !repo) throw new Error("workspaceId and repo required");
    const { token } = await requireGithubToken(workspaceId);
    const commits = await getRecentCommits(token, repo, 20);
    return { commits, repo, fetchedAt: new Date().toISOString() };
  }));

  app.get("/api/github/issues", requireWallet, handle(async (req) => {
    const workspaceId = String(req.query.workspaceId ?? "");
    const repo = String(req.query.repo ?? "");
    const state = (req.query.state as "open" | "closed" | "all") ?? "open";
    if (!workspaceId || !repo) throw new Error("workspaceId and repo required");
    const { token } = await requireGithubToken(workspaceId);
    const issues = await getRepositoryIssues(token, repo, { state, limit: 30 });
    return { issues, repo, state, fetchedAt: new Date().toISOString() };
  }));

  app.get("/api/github/pulls", requireWallet, handle(async (req) => {
    const workspaceId = String(req.query.workspaceId ?? "");
    const repo = String(req.query.repo ?? "");
    const state = (req.query.state as "open" | "closed" | "all") ?? "open";
    if (!workspaceId || !repo) throw new Error("workspaceId and repo required");
    const { token } = await requireGithubToken(workspaceId);
    const pulls = await getPullRequests(token, repo, { state, limit: 30 });
    return { pulls, repo, state, fetchedAt: new Date().toISOString() };
  }));

  app.post("/api/github/sync", requireWallet, handle(async (req) => {
    const { workspaceId } = z.object({ workspaceId: z.string() }).parse(req.body);
    const ws = await storage.getWorkspace(workspaceId);
    if (!ws) throw Object.assign(new Error("workspace_not_found"), { status: 404 });
    const { token } = await requireGithubToken(workspaceId);

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

        await storage.createMemory({
          workspaceId,
          agentId,
          type: "GitHub",
          tags: ["github", "repository", repo.language?.toLowerCase() ?? "code"].filter(Boolean),
          summary: `GitHub: ${repo.fullName} — ${repo.openIssuesCount} issues, ${commits.length} recent commits`,
          encryptedPayload: encrypt(summary),
          storageRef: null,
          embedding: null,
        });
        memoriesCreated++;
        syncedRepos.push(repo.fullName);
      } catch { }
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

  return httpServer;
}
