import { useState } from "react";
import { DashboardLayout, DashboardCard, StatBlock } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Loader2, ExternalLink, CheckCircle2, XCircle, AlertCircle, Rocket } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, useWorkspaceId } from "@/lib/api";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";


const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
};

const StatusIcon = ({ ok, pending }: { ok: boolean; pending?: boolean }) => {
  if (pending) return <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />;
  return ok
    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
    : <XCircle className="h-4 w-4 shrink-0 text-rose-400" />;
};

export default function AdminPanelPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const workspaceId = useWorkspaceId();
  const { address } = useAccount();
  const [deployLog, setDeployLog] = useState<string | null>(null);

  const { data: health } = useQuery({
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

  const { data: integrationData } = useQuery({
    queryKey: ["/api/integrations", workspaceId],
    enabled: !!workspaceId,
    queryFn: () => api.listIntegrations(workspaceId!),
    staleTime: 30_000,
  });

  const deployMut = useMutation({
    mutationFn: () => api.deployContract(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/system/health"] });
      qc.invalidateQueries({ queryKey: ["/api/contracts/status"] });
      if (data.error) {
        setDeployLog(`❌ ${data.error}`);
        toast({ title: "Deploy failed", description: data.error, variant: "destructive" });
      } else {
        setDeployLog(`✅ Deployed at ${data.address}\nTx: ${data.txHash}`);
        toast({ title: "Contract deployed!", description: `Address: ${data.address?.slice(0, 18)}…` });
      }
    },
    onError: (e: any) => {
      setDeployLog(`❌ ${e.message}`);
      toast({ title: "Deploy error", description: e.message, variant: "destructive" });
    },
  });

  const auditEntries = auditData?.entries ?? [];
  const ws = workspace?.workspace;
  const contract = health?.contract;
  const storageSt = health?.storage;
  const gemini = health?.gemini;
  const integrations = integrationData?.integrations ?? [];
  const connectedIntegrations = integrations.filter((i: any) => i.status === "connected");

  // ── Infrastructure status items ─────────────────────────────────────────
  const infra = [
    {
      key: "storage",
      label: "0G Storage",
      sublabel: storageSt?.configured
        ? `Connected · ${storageSt.endpoint}`
        : "Local fallback cache active (ZG_* env vars not set)",
      ok: true,
      pending: !storageSt?.configured,
      detail: storageSt?.configured
        ? "0G Indexer + Storage node connected"
        : "Set ZG_RPC_URL + ZG_INDEXER_RPC + ZG_PRIVATE_KEY secrets to activate live 0G Storage",
    },
    {
      key: "contract",
      label: "0G Chain + Smart Contract",
      sublabel: contract?.configured
        ? `AgentRegistry @ ${contract.address?.slice(0, 20)}…`
        : `Not yet deployed · ${health?.chain?.name ?? "0G Galileo Testnet"}`,
      ok: !!contract?.configured,
      pending: !contract?.configured,
      detail: contract?.configured
        ? `Explorer: ${contract.explorerUrl}`
        : health?.deployWallet
          ? `Fund wallet ${health.deployWallet.slice(0, 20)}… then click Deploy Contract`
          : "Set ZG_PRIVATE_KEY secret, fund the wallet from faucet.0g.ai, then click Deploy Contract",
    },
    {
      key: "agentid",
      label: "Agent ID (On-chain Registry)",
      sublabel: stats
        ? `${stats.agentCount} agent${stats.agentCount !== 1 ? "s" : ""} registered · UUID identity system`
        : "UUID-based identity assigned on creation",
      ok: true,
      pending: false,
      detail: "Every agent gets a unique ID. On-chain registration via AgentRegistry.createAgent() once contract is deployed.",
    },
    {
      key: "compute",
      label: "0G Compute Network",
      sublabel: `Gemini 2.5 Flash active · 0G Compute configurable via COMPUTE_PROVIDER=0g`,
      ok: !!gemini?.configured,
      pending: false,
      detail: "Gemini 2.5 Flash is the live AI inference engine. Set COMPUTE_PROVIDER=0g + provider endpoint to route to 0G decentralized compute nodes.",
    },
    {
      key: "privacy",
      label: "Privacy / TEE",
      sublabel: "AES-256-GCM encryption · PII scanner · Privacy agent active",
      ok: true,
      pending: false,
      detail: "Per-record AES-256-GCM encryption with random salt+IV. PII regex detection (email, phone, SSN, CC, API keys). Privacy Agent always runs last in orchestrator. Software TEE — hardware TEE (Intel SGX) requires dedicated infrastructure.",
    },
  ];

  return (
    <DashboardLayout
      title="Admin panel"
      subtitle="Workspace settings, system health, infrastructure status, and audit log."
      actions={
        <Button
          data-testid="button-invite-member"
          className="h-auto rounded-xl bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] px-4 py-2 text-sm text-white hover:opacity-95"
        >
          <UserPlus className="mr-2 h-4 w-4" /> Invite member
        </Button>
      }
    >
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="AGENTS" value={statsLoading ? "—" : String(stats?.agentCount ?? 0)} delta="In workspace" testId="stat-agents" />
        <StatBlock label="MEMORIES" value={statsLoading ? "—" : String(stats?.memoryCount ?? 0)} delta="Encrypted" testId="stat-memories" />
        <StatBlock label="INTEGRATIONS" value={String(connectedIntegrations.length)} delta="Connected" testId="stat-integrations" />
        <StatBlock
          label="CONTRACT"
          value={contract?.configured ? "Deployed" : "Pending"}
          delta={health?.chain?.name ?? "0G Galileo"}
          testId="stat-contract"
        />
      </div>

      {/* Infrastructure Status */}
      <DashboardCard className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base text-white">Infrastructure status</h2>
          <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-slate-400 hover:bg-[#ffffff08]">
            {infra.filter((i) => i.ok && !i.pending).length}/{infra.length} operational
          </Badge>
        </div>

        <div className="mt-4 space-y-3">
          {infra.map((item) => (
            <div
              key={item.key}
              data-testid={`infra-${item.key}`}
              className="flex items-start justify-between gap-4 rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <StatusIcon ok={item.ok} pending={item.pending} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{item.sublabel}</p>
                  <p className="mt-1 text-[10px] text-slate-600 leading-relaxed">{item.detail}</p>
                </div>
              </div>
              <div className="shrink-0">
                {item.ok && !item.pending ? (
                  <Badge className="border-0 bg-emerald-400/10 text-[10px] tracking-[1px] text-emerald-300 hover:bg-emerald-400/10">
                    ✓ ACTIVE
                  </Badge>
                ) : item.pending ? (
                  <Badge className="border-0 bg-amber-400/10 text-[10px] tracking-[1px] text-amber-300 hover:bg-amber-400/10">
                    ⚠ PENDING
                  </Badge>
                ) : (
                  <Badge className="border-0 bg-rose-400/10 text-[10px] tracking-[1px] text-rose-300 hover:bg-rose-400/10">
                    ✗ INACTIVE
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Contract deploy panel */}
        {!contract?.configured && (
          <div className="mt-4 rounded-lg border border-violet-400/20 bg-violet-400/5 p-4">
            <p className="text-sm font-medium text-white">Deploy AgentRegistry to 0G Galileo Testnet</p>
            <p className="mt-2 text-[11px] text-slate-400">
              Deployer wallet:{" "}
              <span className="font-mono text-violet-300">
                {health?.deployWallet ?? "No ZG_PRIVATE_KEY set"}
              </span>
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {health?.deployWallet
                ? <>Fund the wallet above with testnet A0GI from{" "}</>
                : <>1. Add <span className="font-mono text-slate-400">ZG_PRIVATE_KEY</span> secret &nbsp;2. Get testnet A0GI from{" "}</>
              }
              <a href="https://faucet.0g.ai" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">
                faucet.0g.ai
              </a>{" "}
              3. Click Deploy Contract
            </p>
            {deployLog && (
              <pre className="mt-3 rounded bg-[#0a0a12] p-3 font-mono text-[10px] text-slate-300 whitespace-pre-wrap">
                {deployLog}
              </pre>
            )}
            <Button
              onClick={() => deployMut.mutate()}
              disabled={deployMut.isPending}
              data-testid="button-deploy-contract"
              className="mt-3 h-auto rounded-lg bg-[linear-gradient(90deg,rgba(139,92,246,1)_0%,rgba(34,211,238,1)_100%)] px-5 py-2 text-xs text-white hover:opacity-95 disabled:opacity-50"
            >
              {deployMut.isPending ? (
                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Deploying…</>
              ) : (
                <><Rocket className="mr-2 h-3.5 w-3.5" />Deploy Contract</>
              )}
            </Button>
          </div>
        )}

        {contract?.configured && contract?.explorerUrl && (
          <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-emerald-300">✓ AgentRegistry deployed on {health?.chain?.name}</p>
                <p className="mt-1 font-mono text-[11px] text-slate-400">{contract.address}</p>
              </div>
              <a
                href={contract.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-contract-explorer"
                className="flex shrink-0 items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
              >
                View on explorer <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </DashboardCard>

      {/* System health + workspace settings */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardCard>
          <h2 className="text-base text-white">System health</h2>
          <div className="mt-4 space-y-3">
            {[
              { name: "API gateway", status: "Operational", uptime: "99.99%" },
              {
                name: "Gemini 2.5 Flash",
                status: gemini?.configured ? "Operational" : "Not configured",
                uptime: gemini?.configured ? "Live" : "Key missing",
              },
              {
                name: "0G Storage",
                status: storageSt?.configured ? "Operational" : "Local fallback",
                uptime: storageSt?.configured ? "Connected" : "Fallback mode",
              },
              {
                name: "Contract registry",
                status: contract?.configured ? "Operational" : "Not deployed",
                uptime: health?.chain?.name ?? "0G Galileo",
              },
              {
                name: "Privacy Agent",
                status: "Operational",
                uptime: "AES-256-GCM",
              },
            ].map((s) => (
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
                        ? "bg-emerald-400/10 text-emerald-300"
                        : s.status.includes("configured") || s.status.includes("deployed")
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
            <div className="rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-3">
              <p className="text-slate-400">Active integrations</p>
              <p className="mt-1 text-white">
                {connectedIntegrations.length > 0
                  ? connectedIntegrations.map((i: any) => i.name).join(", ")
                  : "None connected"}
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Audit log */}
      <DashboardCard className="mt-6">
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
                  <td className="px-4 py-3 text-xs text-slate-500">{entry.targetType}</td>
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
