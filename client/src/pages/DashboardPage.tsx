import { Link } from "wouter";
import { DashboardLayout, DashboardCard, StatBlock } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Activity, Zap, Bot } from "lucide-react";

const recentRuns = [
  { id: "r-9012", agent: "Atlas DevOps", status: "Completed", duration: "1.2s", time: "2 min ago" },
  { id: "r-9011", agent: "Echo Support", status: "Completed", duration: "0.8s", time: "5 min ago" },
  { id: "r-9010", agent: "Vault Knowledge", status: "Running", duration: "—", time: "Just now" },
  { id: "r-9009", agent: "Atlas DevOps", status: "Failed", duration: "3.4s", time: "12 min ago" },
  { id: "r-9008", agent: "Pulse Analytics", status: "Completed", duration: "2.1s", time: "18 min ago" },
];

const agents = [
  { name: "Atlas DevOps", calls: "12,489", uptime: "99.98%", trend: "+8.2%" },
  { name: "Echo Support", calls: "9,221", uptime: "99.91%", trend: "+3.4%" },
  { name: "Vault Knowledge", calls: "5,840", uptime: "100%", trend: "+12.1%" },
];

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Workspace overview"
      subtitle="Live snapshot of your agents, memory clusters, and integrations."
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="ACTIVE AGENTS" value="14" delta="↑ 3 this week" testId="stat-agents" />
        <StatBlock label="API CALLS (24H)" value="42,318" delta="↑ 11.4%" testId="stat-calls" />
        <StatBlock label="MEMORY USED" value="186.4 GB" delta="62% of plan" testId="stat-memory" />
        <StatBlock label="SUCCESS RATE" value="99.6%" delta="↑ 0.3%" testId="stat-success" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base text-white">Recent runs</h2>
            <Link
              href="/copilot"
              data-testid="link-view-all-runs"
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              View all →
            </Link>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-[#ffffff0d]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#ffffff05] text-[10px] tracking-[1px] text-slate-500">
                <tr>
                  <th className="px-4 py-3">RUN ID</th>
                  <th className="px-4 py-3">AGENT</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3">DURATION</th>
                  <th className="px-4 py-3">WHEN</th>
                </tr>
              </thead>
              <tbody>
                {recentRuns.map((run) => (
                  <tr
                    key={run.id}
                    data-testid={`row-run-${run.id}`}
                    className="border-t border-[#ffffff0d] text-slate-300"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{run.id}</td>
                    <td className="px-4 py-3">{run.agent}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`border-0 text-[10px] tracking-[1px] hover:bg-transparent ${
                          run.status === "Completed"
                            ? "bg-cyan-400/10 text-cyan-300"
                            : run.status === "Running"
                            ? "bg-violet-400/10 text-violet-300"
                            : "bg-rose-400/10 text-rose-300"
                        }`}
                      >
                        {run.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{run.duration}</td>
                    <td className="px-4 py-3 text-slate-500">{run.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        <DashboardCard>
          <h2 className="text-base text-white">Top agents</h2>
          <div className="mt-4 space-y-4">
            {agents.map((a) => (
              <div
                key={a.name}
                data-testid={`agent-summary-${a.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white">{a.name}</p>
                  <span className="text-xs text-cyan-400">{a.trend}</span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" /> {a.calls} calls
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3" /> {a.uptime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { icon: Bot, label: "Deploy from marketplace", href: "/marketplace" },
          { icon: Activity, label: "Inspect memory cluster", href: "/memory" },
          { icon: Zap, label: "Connect new integration", href: "/integrations" },
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
