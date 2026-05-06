import { agentReason } from "../lib/gemini";
import type { AgentResult } from "./index";
import type { RankedMemory } from "./memoryAgent";

export interface DevOpsAgentInput {
  query: string;
  memories: RankedMemory[];
}

export interface DevOpsInsight {
  category: "incident" | "performance" | "deployment" | "general";
  severity: "low" | "medium" | "high";
  insight: string;
  recommendedActions: string[];
  relatedMemoryIds: string[];
}

const classify = (q: string): DevOpsInsight["category"] => {
  const lq = q.toLowerCase();
  if (/incident|outage|fail|crash|down|error/.test(lq)) return "incident";
  if (/slow|latency|perf|timeout/.test(lq)) return "performance";
  if (/deploy|release|rollback|stage/.test(lq)) return "deployment";
  return "general";
};

const sev = (memCount: number): DevOpsInsight["severity"] => {
  if (memCount >= 5) return "high";
  if (memCount >= 2) return "medium";
  return "low";
};

export const runDevOpsAgent = async (
  input: DevOpsAgentInput,
): Promise<AgentResult<DevOpsInsight>> => {
  const start = Date.now();
  const category = classify(input.query);
  const severity = sev(input.memories.length);
  const contextSummaries = input.memories.map((m) => m.summary);

  let insightText: string;
  let actions: string[];

  try {
    insightText = await agentReason(
      `DevOps Engineer specializing in ${category} analysis`,
      input.query,
      contextSummaries,
    );
    actions = [
      category === "incident"
        ? "Open incident channel and notify on-call team."
        : category === "performance"
        ? "Profile the affected service and compare against baseline metrics."
        : category === "deployment"
        ? "Verify staging gate checks and prepare rollback procedure."
        : "Continue monitoring and document findings.",
      "Tag and store this analysis as a DevOps memory for future reference.",
    ];
  } catch {
    insightText = input.memories[0]
      ? `Top correlated memory: ${input.memories[0].summary}`
      : "No correlated historical data found.";
    actions = ["Manual investigation required."];
  }

  return {
    agent: "devops",
    summary: `[${category.toUpperCase()} / ${severity}] ${insightText.slice(0, 120)}`,
    output: {
      category,
      severity,
      insight: insightText,
      recommendedActions: actions,
      relatedMemoryIds: input.memories.slice(0, 3).map((m) => m.memoryId),
    },
    latencyMs: Date.now() - start,
  };
};
