export const api = {
  walletConnect: (wallet: string, workspaceName?: string) =>
    fetch("/api/wallet/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, workspaceName }),
    }).then((r) => r.json()),

  systemHealth: () => fetch("/api/system/health").then((r) => r.json()),

  contractStatus: () => fetch("/api/contracts/status").then((r) => r.json()),

  dashboardStats: (workspaceId: string) =>
    fetch(`/api/dashboard/stats/${workspaceId}`).then((r) => r.json()),

  runOrchestrator: (workspaceId: string, query: string) =>
    fetch("/api/orchestrator/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, query }),
    }).then((r) => r.json()),

  chatCopilot: (
    workspaceId: string,
    message: string,
    history: { role: "user" | "assistant"; content: string }[],
  ) =>
    fetch("/api/copilot/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, message, history }),
    }).then((r) => r.json()),

  getInsights: (workspaceId: string) =>
    fetch(`/api/insights/${workspaceId}`).then((r) => r.json()),

  listAgents: (workspaceId: string) =>
    fetch(`/api/agents?workspaceId=${workspaceId}`).then((r) => r.json()),

  createAgent: (input: {
    workspaceId: string;
    ownerWallet: string;
    name: string;
    role: string;
    initialMemorySize?: number;
  }) =>
    fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((r) => r.json()),

  listMemories: (workspaceId: string) =>
    fetch(`/api/memory?workspaceId=${workspaceId}`).then((r) => r.json()),

  createMemory: (input: {
    workspaceId: string;
    agentId: string;
    type?: string;
    tags?: string[];
    summary?: string;
    payload: string;
  }) =>
    fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((r) => r.json()),

  scanPrivacy: (text: string) =>
    fetch("/api/privacy/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).then((r) => r.json()),
};

export const useWorkspaceId = (): string | null =>
  typeof window === "undefined" ? null : localStorage.getItem("nv_workspace_id");

export const setWorkspaceId = (id: string) =>
  localStorage.setItem("nv_workspace_id", id);
