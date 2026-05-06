import { Link } from "wouter";
import { DashboardLayout, DashboardCard, StatBlock } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Activity, Zap, Bot, Loader2, Brain } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, useWorkspaceId } from "@/lib/api";

interface DashStats {
  agentCount: number;
  memoryCount: number;
  auditCount: number;
  storageBackend: string;
  contractConfigured: boolean;
  contractAddress: string | null;
  chainName: string;
  recentAudit: any[];
  agents: any[];
}

interface Insight {
  title: string;
  description: string;
  category: string;
  severity: "info" | "warning" | "critical";
  recommendation: string;
}

const actionColor = (action: string) => {
  if (action.includes("create")) return "bg-cyan-400/10 text-cyan-300";
  if (action.includes("run") || action.includes("chat")) return "bg-violet-400/10 text-violet-300";
  if (action.includes("connect")) return "bg-emerald-400/10 text-emerald-300";
  return "bg-slate-400/10 text-slate-300";
};

const severityColor = (s: string) => {
  if (s === "critical") return "bg-rose-400/10 text-rose-300";
  if (s === "warning") return "bg-amber-400/10 text-amber-300";
  return "bg-cyan-400/10 text-cyan-300";
};

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
};

export default function DashboardPage() {
  const workspaceId = useWorkspaceId();

  const { data: stats, isLoading: statsLoading } = useQuery<DashStats>({
    queryKey: ["/api/dashboard/stats", workspaceId],
    enabled: !!workspaceId,
    queryFn: () => api.dashboardStats(workspaceId!),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery<{ insights: Insight[] }>({
    queryKey: ["/api/insights", workspaceId],
    enabled: !!workspaceId,
    queryFn: () => api.getInsights(workspaceId!),
    staleTime: 120_000,
  });

  const insights = insightsData?.insights ?? [];

  return (
    <DashboardLayout
      title="Workspace overview"
      subtitle="Live data from your agents, memories, and the 0G chain."
      actions={
        <Link
          href="/agents/new"
          data-testid="button-new-agent"
          className="inline-flex h-auto items-center justify-center rounded-xl bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] px-4 py-2 text-sm text-white hover:opacity-95"
        >
          + New Agent
        </Link>
      }
    >
      {!workspaceId && (
        <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/5 px-5 py-4 text-sm text-amber-300">
          Connect your wallet to see live workspace data.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock
          label="ACTIVE AGENTS"
          value={statsLoading ? "—" : String(stats?.agentCount ?? 0)}
          delta={stats ? `Real-time count` : "Connect wallet"}
          testId="stat-agents"
        />
        <StatBlock
          label="MEMORIES STORED"
          value={statsLoading ? "—" : String(stats?.memoryCount ?? 0)}
          delta={stats?.storageBackend ? `via ${stats.storageBackend}` : ""}
          testId="stat-memory"
        />
        <StatBlock
          label="AUDIT EVENTS"
          value={statsLoading ? "—" : String(stats?.auditCount ?? 0)}
          delta="Total workspace actions"
          testId="stat-calls"
        />
        <StatBlock
          label="CHAIN"
          value={stats?.chainName ? stats.chainName.split(" ")[0] : "0G"}
          delta={stats?.contractConfigured ? "Contract deployed" : "No contract yet"}
          testId="stat-success"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base text-white">Recent activity</h2>
            <Link
              href="/copilot"
              data-testid="link-view-all-runs"
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              Open Copilot →
            </Link>
          </div>

          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
            </div>
          ) : !workspaceId || !stats?.recentAudit?.length ? (
            <div className="py-12 text-center text-sm text-slate-500">
              {workspaceId
                ? "No activity yet. Create an agent or start chatting."
                : "Connect your wallet to see activity."}
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-[#ffffff0d]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#ffffff05] text-[10px] tracking-[1px] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">ACTION</th>
                    <th className="px-4 py-3">TARGET</th>
                    <th className="px-4 py-3">WHEN</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentAudit.map((entry: any) => (
                    <tr
                      key={entry.id}
                      data-testid={`row-run-${entry.id}`}
                      className="border-t border-[#ffffff0d] text-slate-300"
                    >
                      <td className="px-4 py-3">
                        <Badge className={`border-0 text-[10px] tracking-[1px] hover:bg-transparent ${actionColor(entry.action)}`}>
                          {entry.action.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {entry.targetType}{entry.targetId ? `:${entry.targetId.slice(0, 8)}` : ""}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{timeAgo(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>

        <DashboardCard>
          <h2 className="text-base text-white">Agents</h2>
          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
            </div>
          ) : !stats?.agents?.length ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">No agents yet.</p>
              <Link href="/agents/new" className="mt-2 inline-block text-xs text-violet-400 hover:underline">
                Create your first agent →
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {stats.agents.map((a: any) => (
                <div
                  key={a.id}
                  data-testid={`agent-summary-${a.id}`}
                  className="rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white">{a.name}</p>
                    <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[9px] tracking-[1px] text-violet-300 hover:bg-[#ffffff08]">
                      {a.role.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" /> {a.memorySize} memories
                    </span>
                    {a.onchainAgentId && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3 text-cyan-400" /> On-chain
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Gemini Insights */}
      <div className="mt-8">
        <DashboardCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-violet-400" />
              <h2 className="text-base text-white">AI Insights</h2>
            </div>
            <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-violet-300 hover:bg-[#ffffff08]">
              GEMINI-POWERED
            </Badge>
          </div>

          {!workspaceId ? (
            <p className="mt-4 text-sm text-slate-500">Connect your wallet to unlock AI insights.</p>
          ) : insightsLoading ? (
            <div className="flex items-center gap-2 py-6 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Gemini is analyzing your workspace…</span>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {insights.map((ins, i) => (
                <div
                  key={i}
                  data-testid={`insight-${i}`}
                  className="rounded-xl border border-[#ffffff0d] bg-[#ffffff05] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-white">{ins.title}</p>
                    <Badge className={`shrink-0 border-0 text-[9px] tracking-[1px] hover:bg-transparent ${severityColor(ins.severity)}`}>
                      {ins.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{ins.description}</p>
                  <p className="mt-2 text-[11px] text-violet-300">→ {ins.recommendation}</p>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { icon: Bot, label: "Deploy from marketplace", href: "/marketplace" },
          { icon: Activity, label: "Inspect memories", href: "/memory" },
          { icon: Zap, label: "Open AI Copilot", href: "/copilot" },
        ].map((q) => {
          const Icon = q.icon;
          return (
            <Link
              key={q.href}
              href={q.href}
              data-testid={`quick-action-${q.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="group flex items-center justify-between rounded-2xl border border-[#ffffff14] bg-[#ffffff08] p-5 transition-colors hover:bg-[#ffffff10]"
            >
              <span className="flex items-center gap-3 text-sm text-white">
                <Icon className="h-4 w-4 text-violet-400" />
                {q.label}
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-500 transition-colors group-hover:text-white" />
            </Link>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
