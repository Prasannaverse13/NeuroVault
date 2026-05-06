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
  const monetizationHint =
    totalUsd > 500
      ? "Workspace qualifies for Enterprise tier — apply 18% volume discount."
      : "Workspace is on Pro tier; no discount applied.";

  return {
    agent: "billing",
    summary: `Computed usage cost: $${totalUsd.toFixed(2)} for workspace ${input.workspaceId}.`,
    output: {
      computeCostUsd,
      storageCostUsd,
      vectorCostUsd,
      totalUsd,
      monetizationHint,
    },
    latencyMs: Date.now() - start,
  };
};
