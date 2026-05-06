import { DashboardLayout, DashboardCard, StatBlock } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Loader2, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, useWorkspaceId } from "@/lib/api";
import { useAccount } from "wagmi";

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
};

export default function AdminPanelPage() {
  const workspaceId = useWorkspaceId();
  const { address } = useAccount();

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["/api/system/health"],
    queryFn: () => api.systemHealth(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats", workspaceId],
    enabled: !!workspaceId,
    queryFn: () => api.dashboardStats(workspaceId!),
    staleTime: 30_000,
  });

  const { data: workspace } = useQuery({
    queryKey: ["/api/workspaces", workspaceId],
    enabled: !!workspaceId,
    queryFn: () => fetch(`/api/workspaces/${workspaceId}`).then((r) => r.json()),
    staleTime: 60_000,
  });

  const { data: auditData } = useQuery({
    queryKey: ["/api/workspaces", workspaceId, "audit"],
    enabled: !!workspaceId,
    queryFn: () => fetch(`/api/workspaces/${workspaceId}/audit`).then((r) => r.json()),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const auditEntries = auditData?.entries ?? [];
  const ws = workspace?.workspace;
  const contract = health?.contract;

  const systemServices = [
    { name: "API gateway", status: "Operational", uptime: "99.99%" },
    {
      name: "Gemini AI (1.5 Pro)",
      status: health?.gemini?.configured ? "Operational" : "Not configured",
      uptime: health?.gemini?.configured ? "Live" : "Key missing",
    },
    {
      name: "0G Storage",
      status: health?.storage?.configured ? "Operational" : "Local fallback",
      uptime: health?.storage?.configured ? "Connected" : "Fallback mode",
    },
    {
      name: "Contract registry",
      status: contract?.configured ? "Operational" : "Not deployed",
      uptime: health?.chain?.name ?? "0G Galileo",
    },
  ];

  return (
    <DashboardLayout
      title="Admin panel"
      subtitle="Workspace settings, system health, and audit log."
      actions={
        <Button
          data-testid="button-invite-member"
          className="h-auto rounded-xl bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] px-4 py-2 text-sm text-white hover:opacity-95"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Invite member
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="AGENTS" value={statsLoading ? "—" : String(stats?.agentCount ?? 0)} delta="In workspace" testId="stat-members" />
        <StatBlock label="MEMORIES" value={statsLoading ? "—" : String(stats?.memoryCount ?? 0)} delta="Encrypted" testId="stat-workspaces" />
        <StatBlock label="AUDIT EVENTS" value={statsLoading ? "—" : String(stats?.auditCount ?? 0)} delta="Total" testId="stat-mau" />
        <StatBlock
          label="CONTRACT"
          value={contract?.configured ? "Deployed" : "Pending"}
          delta={contract?.chain?.name ?? "0G Galileo"}
          testId="stat-incidents"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardCard>
          <h2 className="text-base text-white">System health</h2>
          <div className="mt-4 space-y-3">
            {systemServices.map((s) => (
              <div
                key={s.name}
                data-testid={`health-${s.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex items-center justify-between rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-3 text-sm"
              >
                <span className="text-white">{s.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{s.uptime}</span>
                  <Badge
                    className={`border-0 text-[10px] tracking-[1px] hover:bg-transparent ${
                      s.status === "Operational"
                        ? "bg-cyan-400/10 text-cyan-300"
                        : s.status === "Not configured" || s.status === "Not deployed"
                        ? "bg-amber-400/10 text-amber-300"
                        : "bg-slate-400/10 text-slate-300"
                    }`}
                  >
                    {s.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard>
          <h2 className="text-base text-white">Workspace settings</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-3">
              <p className="text-slate-400">Workspace name</p>
              <p className="mt-1 text-white">{ws?.name ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-3">
              <p className="text-slate-400">Owner wallet</p>
              <p className="mt-1 font-mono text-xs text-white">{address ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-3">
              <p className="text-slate-400">AI Provider</p>
              <p className="mt-1 text-white">Gemini 2.5 Flash</p>
            </div>
            {contract?.configured && contract?.explorerUrl && (
              <a
                href={contract.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3"
              >
                <div>
                  <p className="text-cyan-300">AgentRegistry contract</p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                    {contract.address?.slice(0, 20)}…
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-cyan-400" />
              </a>
            )}
          </div>
        </DashboardCard>
      </div>

      <DashboardCard className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base text-white">Audit log</h2>
          <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-slate-400 hover:bg-[#ffffff08]">
            {auditEntries.length} events
          </Badge>
        </div>
        <div className="mt-4 overflow-hidden rounded-lg border border-[#ffffff0d]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#ffffff05] text-[10px] tracking-[1px] text-slate-500">
              <tr>
                <th className="px-4 py-3">ACTION</th>
                <th className="px-4 py-3">ACTOR</th>
                <th className="px-4 py-3">TARGET</th>
                <th className="px-4 py-3">WHEN</th>
              </tr>
            </thead>
            <tbody>
              {auditEntries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    {workspaceId ? "No audit events yet." : "Connect wallet to view audit log."}
                  </td>
                </tr>
              )}
              {auditEntries.map((entry: any) => (
                <tr
                  key={entry.id}
                  data-testid={`audit-row-${entry.id}`}
                  className="border-t border-[#ffffff0d] text-slate-300"
                >
                  <td className="px-4 py-3">
                    <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-violet-300 hover:bg-[#ffffff08]">
                      {entry.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">
                    {entry.actorWallet?.slice(0, 10) ?? "system"}…
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {entry.targetType}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{timeAgo(entry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </DashboardLayout>
  );
}
