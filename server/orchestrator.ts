/**
 * OpenClaw-style orchestrator — Gemini-powered.
 *
 * Flow: Memory → DevOps → Billing → Gemini inference → Privacy (always last)
 */
import type { Memory } from "@shared/schema";
import {
  runMemoryAgent,
  runDevOpsAgent,
  runPrivacyAgent,
  runBillingAgent,
  type AgentName,
  type AgentResult,
} from "./agents";
import { chatWithHistory, type ChatMessage } from "./lib/gemini";
import { computeStatus } from "./lib/zeroGCompute";
import { randomBytes } from "node:crypto";

export interface OrchestratorContext {
  workspaceId: string;
  query: string;
  memories: Memory[];
  usage: { apiCalls: number; storageGb: number; vectorQueries: number };
  agentRouting?: AgentName[];
  chatHistory?: ChatMessage[];
  integrationContext?: string;
}

export interface OrchestratorWorkflow {
  workspaceId: string;
  query: string;
  steps: AgentResult[];
  finalResponse: string;
  inferenceJobId: string;
  totalLatencyMs: number;
  routedTo: AgentName[];
  provider: string;
}

const decideRouting = (query: string): AgentName[] => {
  const lq = query.toLowerCase();
  const route: AgentName[] = ["memory"];
  if (/deploy|incident|infra|outage|latency|error|slow|crash/.test(lq)) route.push("devops");
  route.push("privacy");
  if (/cost|bill|usage|spend|invoice|price|budget/.test(lq)) route.push("billing");
  return route;
};

export const orchestrate = async (
  ctx: OrchestratorContext,
): Promise<OrchestratorWorkflow> => {
  const start = Date.now();
  const routedTo = ctx.agentRouting ?? decideRouting(ctx.query);
  const steps: AgentResult[] = [];

  // 1. Memory Agent — vector retrieval + Gemini context analysis
  const memoryStep = await runMemoryAgent({
    query: ctx.query,
    memories: ctx.memories,
    topK: 5,
  });
  steps.push(memoryStep);

  const retrievedMemories = memoryStep.output as any[];
  const contextSummaries: string[] = retrievedMemories.map((m: any) => m.summary);

  // 2. DevOps Agent — Gemini-powered incident/performance analysis
  if (routedTo.includes("devops")) {
    const devopsStep = await runDevOpsAgent({
      query: ctx.query,
      memories: retrievedMemories,
    });
    steps.push(devopsStep);
  }

  // 3. Billing Agent — usage analysis
  if (routedTo.includes("billing")) {
    const billingStep = await runBillingAgent({
      workspaceId: ctx.workspaceId,
      ...ctx.usage,
    });
    steps.push(billingStep);
  }

  // 4. Gemini inference — full context-aware response
  const agentFindings = steps
    .map((s) => `[${s.agent.toUpperCase()}] ${s.summary}`)
    .join("\n");

  const integrationLine = ctx.integrationContext
    ? `\nActive integrations: ${ctx.integrationContext}`
    : "";

  const systemInstruction = `You are NeuroVault Copilot, an enterprise AI assistant with deep memory context.
You have access to the following workspace memories and agent analyses:

Memory context:
${contextSummaries.length > 0 ? contextSummaries.map((s, i) => `${i + 1}. ${s}`).join("\n") : "No prior memories."}

Agent findings:
${agentFindings}${integrationLine}

Be precise, professional, and actionable. Reference specific memory findings when relevant.`;

  const history = ctx.chatHistory ?? [];
  const jobId = randomBytes(8).toString("hex");
  let draft: string;
  try {
    draft = await chatWithHistory(systemInstruction, history, ctx.query);
  } catch (err) {
    console.warn("[orchestrator] Gemini failed:", err);
    draft = `[Gemini inference failed] Agent summary: ${agentFindings}`;
  }

  // 5. Privacy Agent — ALWAYS runs last, sanitizes before returning
  const sanitized = await runPrivacyAgent({
    text: draft,
    enforceRedaction: true,
  });
  steps.push(sanitized);

  return {
    workspaceId: ctx.workspaceId,
    query: ctx.query,
    steps,
    finalResponse: (sanitized.output as any).sanitizedText,
    inferenceJobId: jobId,
    totalLatencyMs: Date.now() - start,
    routedTo,
    provider: "gemini-2.5-flash",
  };
};
