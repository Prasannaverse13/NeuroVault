import { agentReason } from "../lib/gemini";
import type { AgentResult } from "./index";

export interface BillingAgentInput {
  workspaceId: string;
  apiCalls: number;
  storageGb: number;
  vectorQueries: number;
}

export interface BillingReport {
  computeCostUsd: number;
  storageCostUsd: number;
  vectorCostUsd: number;
  totalUsd: number;
  tier: string;
  monetizationHint: string;
}

const PRICE = {
  perCall: 0.0015,
  perGb: 1.2,
  perVectorQuery: 0.000004,
};

export const runBillingAgent = async (
  input: BillingAgentInput,
): Promise<AgentResult<BillingReport>> => {
  const start = Date.now();
  const computeCostUsd = +(input.apiCalls * PRICE.perCall).toFixed(2);
  const storageCostUsd = +(input.storageGb * PRICE.perGb).toFixed(2);
  const vectorCostUsd = +(input.vectorQueries * PRICE.perVectorQuery).toFixed(2);
  const totalUsd = +(computeCostUsd + storageCostUsd + vectorCostUsd).toFixed(2);
  const tier = totalUsd > 500 ? "Enterprise" : totalUsd > 100 ? "Pro" : "Starter";

  let monetizationHint =
    tier === "Enterprise"
      ? "Workspace qualifies for Enterprise tier — apply 18% volume discount."
      : "Workspace is on Pro tier. Growing usage detected.";

  try {
    monetizationHint = await agentReason(
      "Billing Analyst",
      `Workspace ${input.workspaceId} used ${input.apiCalls} API calls, ${input.storageGb.toFixed(2)} GB storage, ${input.vectorQueries} vector queries this period. Total: $${totalUsd}. Current tier: ${tier}.`,
      [],
    );
  } catch {
    // keep default
  }

  return {
    agent: "billing",
    summary: `Usage cost: $${totalUsd.toFixed(2)} | Tier: ${tier} | Workspace: ${input.workspaceId.slice(0, 8)}`,
    output: {
      computeCostUsd,
      storageCostUsd,
      vectorCostUsd,
      totalUsd,
      tier,
      monetizationHint,
    },
    latencyMs: Date.now() - start,
  };
};
