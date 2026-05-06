export type AgentName = "memory" | "devops" | "privacy" | "billing";

export interface AgentResult<T = unknown> {
  agent: AgentName;
  summary: string;
  output: T;
  latencyMs: number;
}

export { runMemoryAgent } from "./memoryAgent";
export { runDevOpsAgent } from "./devopsAgent";
export { runPrivacyAgent } from "./privacyAgent";
export { runBillingAgent } from "./billingAgent";
