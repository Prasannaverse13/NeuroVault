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
  const top = input.memories[0];

  const insight: DevOpsInsight = {
    category,
    severity,
    insight: top
      ? `Top correlated memory (${top.score.toFixed(3)} relevance): ${top.summary}`
      : "No correlated historical memories found for this query.",
    recommendedActions: [
      category === "incident"
        ? "Open an incident channel and notify on-call."
        : category === "performance"
        ? "Profile the affected service and check recent deploys."
        : category === "deployment"
        ? "Verify staging gates and rollback if smoke tests fail."
        : "Continue monitoring; no immediate action required.",
      "Capture this finding as a new memory tagged 'devops'.",
    ],
    relatedMemoryIds: input.memories.slice(0, 3).map((m) => m.memoryId),
  };

  return {
    agent: "devops",
    summary: `Classified query as ${category} (${severity} severity).`,
    output: insight,
    latencyMs: Date.now() - start,
  };
};
