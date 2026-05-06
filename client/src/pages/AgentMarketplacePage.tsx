import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout, DashboardCard } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Download, Search, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { api, useWorkspaceId } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import type { Agent } from "@shared/schema";

// ── Marketplace catalog ────────────────────────────────────────────────────
const MARKETPLACE = [
  {
    id: "atlas-devops",
    name: "Atlas DevOps",
    author: "NeuroLabs",
    category: "DevOps",
    role: "devops" as const,
    rating: 4.9,
    installs: "12.4k",
    price: "Free",
    desc: "Production infrastructure agent with deep observability memory. Tracks incidents, root-cause patterns, and deployment history.",
  },
  {
    id: "echo-support",
    name: "Echo Support",
    author: "VaultAI",
    category: "Support",
    role: "support" as const,
    rating: 4.8,
    installs: "9.1k",
    price: "Free",
    desc: "Empathetic customer support agent with full conversation history and ticket resolution tracking.",
  },
  {
    id: "pulse-analytics",
    name: "Pulse Analytics",
    author: "Synth",
    category: "Analytics",
    role: "analytics" as const,
    rating: 4.7,
    installs: "6.8k",
    price: "Free",
    desc: "Real-time analytics narrator with anomaly detection and KPI memory across reporting cycles.",
  },
  {
    id: "vault-knowledge",
    name: "Vault Knowledge",
    author: "NeuroLabs",
    category: "Knowledge",
    role: "knowledge" as const,
    rating: 4.9,
    installs: "15.2k",
    price: "Free",
    desc: "Converts fragmented docs, wikis, and notes into a unified, queryable knowledge core.",
  },
  {
    id: "compliance-bot",
    name: "Compliance Bot",
    author: "TrustOS",
    category: "Security",
    role: "security" as const,
    rating: 4.6,
    installs: "3.2k",
    price: "Free",
    desc: "SOC2 / HIPAA / GDPR aware policy enforcement agent with PII scan and audit trail generation.",
  },
  {
    id: "forge-coder",
    name: "Forge Coder",
    author: "DevForge",
    category: "DevOps",
    role: "devops" as const,
    rating: 4.8,
    installs: "8.7k",
    price: "Free",
    desc: "Multi-repo code review agent with refactor suggestions and commit-level memory.",
  },
  {
    id: "lumen-research",
    name: "Lumen Research",
    author: "Helix",
    category: "Knowledge",
    role: "knowledge" as const,
    rating: 4.5,
    installs: "4.4k",
    price: "Free",
    desc: "Synthesizes research papers, news, and internal docs into structured intelligence briefs.",
  },
  {
    id: "sage-sales",
    name: "Sage Sales",
    author: "Closer",
    category: "Sales",
    role: "sales" as const,
    rating: 4.4,
    installs: "5.6k",
    price: "Free",
    desc: "Conversational sales agent with CRM-grade deal memory and pipeline stage tracking.",
  },
];

const FILTERS = ["All", "DevOps", "Support", "Analytics", "Knowledge", "Security", "Sales"];

export default function AgentMarketplacePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const workspaceId = useWorkspaceId();
  const { address } = useAccount();

  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [installing, setInstalling] = useState<string | null>(null);

  // ── Fetch existing agents ─────────────────────────────────────────────────
  const { data: agentData } = useQuery({
    queryKey: ["/api/agents", workspaceId],
    queryFn: () => api.listAgents(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 10_000,
  });

  const installedAgents: Agent[] = agentData?.agents ?? [];

  // Build a lookup: marketplaceId → agent
  const installedByMarketId = Object.fromEntries(
    installedAgents
      .filter((a) => (a as any).marketplaceId)
      .map((a) => [(a as any).marketplaceId as string, a]),
  );

  // Also match by exact name for agents installed before marketplaceId tracking
  const installedByName = Object.fromEntries(
    installedAgents.map((a) => [a.name.toLowerCase(), a]),
  );

  // ── Install mutation ──────────────────────────────────────────────────────
  const installMut = useMutation({
    mutationFn: async (item: typeof MARKETPLACE[number]) => {
      if (!workspaceId || !address) throw new Error("Connect your wallet first");
      return api.createAgent({
        workspaceId,
        ownerWallet: address,
        name: item.name,
        role: item.role,
        initialMemorySize: 0,
        source: "marketplace",
        marketplaceId: item.id,
      });
    },
    onMutate: (item) => setInstalling(item.id),
    onSuccess: (result, item) => {
      qc.invalidateQueries({ queryKey: ["/api/agents", workspaceId] });
      const agentId = result.agent?.id;
      toast({
        title: `${item.name} installed`,
        description: `Agent ID: ${agentId?.slice(0, 8)}…  Role: ${item.role}`,
      });
    },
    onError: (e: any) => toast({ title: "Install failed", description: e.message, variant: "destructive" }),
    onSettled: () => setInstalling(null),
  });

  const isInstalled = (item: typeof MARKETPLACE[number]) =>
    installedByMarketId[item.id] ?? installedByName[item.name.toLowerCase()] ?? null;

  const visible = MARKETPLACE.filter((a) => {
    const f = filter === "All" || a.category === filter;
    const q =
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.desc.toLowerCase().includes(query.toLowerCase()) ||
      a.author.toLowerCase().includes(query.toLowerCase());
    return f && q;
  });

  const installedCount = MARKETPLACE.filter((m) => isInstalled(m)).length;

  return (
    <DashboardLayout
      title="Agent marketplace"
      subtitle={`${installedCount} installed · ${MARKETPLACE.length} available · Powered by Gemini 2.5 Flash`}
    >
      {/* Search + filter row */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents…"
            data-testid="input-marketplace-search"
            className="w-full rounded-lg border border-[#ffffff14] bg-[#ffffff08] py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              data-testid={`filter-marketplace-${f.toLowerCase()}`}
              className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
                filter === f
                  ? "bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] text-white"
                  : "border border-[#ffffff14] bg-[#ffffff08] text-slate-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {!workspaceId && (
        <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-center text-sm text-amber-300">
          Connect your wallet to install agents into your workspace.
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => {
          const agent = isInstalled(item);
          const isInstalledNow = !!agent;
          const isCurrentlyInstalling = installing === item.id;

          return (
            <DashboardCard key={item.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p
                    data-testid={`agent-card-${item.id}`}
                    className="text-base text-white"
                  >
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500">by {item.author}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-violet-300 hover:bg-[#ffffff08]">
                    {item.category.toUpperCase()}
                  </Badge>
                  {isInstalledNow && (
                    <Badge className="border-0 bg-emerald-400/10 text-[10px] tracking-[1px] text-emerald-300 flex items-center gap-1 hover:bg-emerald-400/10">
                      <CheckCircle2 className="h-2.5 w-2.5" /> INSTALLED
                    </Badge>
                  )}
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-xs text-slate-400">{item.desc}</p>

              {isInstalledNow && (
                <div className="mt-2 rounded-md border border-[#ffffff0d] bg-[#ffffff05] px-2 py-1.5">
                  <p className="text-[10px] text-slate-500">
                    Agent ID: <span className="font-mono text-violet-400">{agent.id.slice(0, 18)}…</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Role: <span className="text-cyan-400">{agent.role}</span>
                    {" · "}Memory: <span className="text-white">{agent.memorySize} records</span>
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1 text-amber-300">
                  <Star className="h-3 w-3 fill-current" /> {item.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="h-3 w-3" /> {item.installs}
                </span>
                <span className="ml-auto font-medium text-emerald-400">{item.price}</span>
              </div>

              {isInstalledNow ? (
                <Button
                  type="button"
                  variant="ghost"
                  data-testid={`button-view-${item.id}`}
                  onClick={() => {
                    navigator.clipboard?.writeText(agent.id);
                    toast({ title: "Agent ID copied", description: agent.id });
                  }}
                  className="mt-4 h-auto w-full rounded-lg border border-emerald-400/20 bg-emerald-400/10 py-2 text-xs text-emerald-300 hover:bg-emerald-400/20"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Installed · Copy Agent ID
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => installMut.mutate(item)}
                  disabled={isCurrentlyInstalling || !workspaceId}
                  data-testid={`button-install-${item.id}`}
                  className="mt-4 h-auto w-full rounded-lg bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] py-2 text-xs text-white hover:opacity-95 disabled:opacity-50"
                >
                  {isCurrentlyInstalling ? (
                    <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Installing…</>
                  ) : (
                    "Install agent"
                  )}
                </Button>
              )}
            </DashboardCard>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
