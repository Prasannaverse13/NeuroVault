/**
 * OpenClaw-style orchestrator.
 *
 * Coordinates Memory → DevOps → Privacy → Billing agents, then synthesizes
 * a final response via the Compute layer.
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
import { executeInference } from "./lib/zeroGCompute";

export interface OrchestratorContext {
  workspaceId: string;
  query: string;
  memories: Memory[];
  usage: { apiCalls: number; storageGb: number; vectorQueries: number };
  agentRouting?: AgentName[];
}

export interface OrchestratorWorkflow {
  workspaceId: string;
  query: string;
  steps: AgentResult[];
  finalResponse: string;
  inferenceJobId: string;
  totalLatencyMs: number;
  routedTo: AgentName[];
}

const decideRouting = (query: string): AgentName[] => {
  const lq = query.toLowerCase();
  const route: AgentName[] = ["memory"];
  if (/deploy|incident|infra|outage|latency|error|slow/.test(lq)) route.push("devops");
  route.push("privacy");
  if (/cost|bill|usage|spend|invoice|price/.test(lq)) route.push("billing");
  return route;
};

export const orchestrate = async (
  ctx: OrchestratorContext,
): Promise<OrchestratorWorkflow> => {
  const start = Date.now();
  const routedTo = ctx.agentRouting ?? decideRouting(ctx.query);
  const steps: AgentResult[] = [];

  // 1. Memory Agent — always runs first to establish context
  const memoryStep = await runMemoryAgent({
    query: ctx.query,
    memories: ctx.memories,
    topK: 5,
  });
  steps.push(memoryStep);

  // 2. DevOps Agent — analyzes against retrieved memories
  if (routedTo.includes("devops")) {
    const devopsStep = await runDevOpsAgent({
      query: ctx.query,
      memories: memoryStep.output as any,
    });
    steps.push(devopsStep);
  }

  // 3. Billing Agent — usage + monetization
  if (routedTo.includes("billing")) {
    const billingStep = await runBillingAgent({
      workspaceId: ctx.workspaceId,
      ...ctx.usage,
    });
    steps.push(billingStep);
  }

  // 4. Compute / inference synthesis
  const draft = steps
    .map((s) => `[${s.agent.toUpperCase()}] ${s.summary}`)
    .join("\n");
  const inference = await executeInference({
    prompt: `Synthesize a workspace response for: "${ctx.query}"\nAgent findings:\n${draft}`,
    context: (memoryStep.output as any[]).map((m: any) => m.summary),
  });

  // 5. Privacy Agent — sanitize the final response (always runs last)
  const sanitized = await runPrivacyAgent({
    text: inference.output,
    enforceRedaction: true,
  });
  steps.push(sanitized);

  return {
    workspaceId: ctx.workspaceId,
    query: ctx.query,
    steps,
    finalResponse: (sanitized.output as any).sanitizedText,
    inferenceJobId: inference.jobId,
    totalLatencyMs: Date.now() - start,
    routedTo,
  };
};
