import { DashboardLayout, DashboardCard, StatBlock } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Loader2, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, useWorkspaceId } from "@/lib/api";
import { useAccount } from "wagmi";

export default function WalletBillingPage() {
  const workspaceId = useWorkspaceId();
  const { address } = useAccount();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats", workspaceId],
    enabled: !!workspaceId,
    queryFn: () => api.dashboardStats(workspaceId!),
    staleTime: 60_000,
  });

  const { data: contractData } = useQuery({
    queryKey: ["/api/contracts/status"],
    queryFn: () => api.contractStatus(),
    staleTime: 60_000,
  });

  const memCount = stats?.memoryCount ?? 0;
  const agentCount = stats?.agentCount ?? 0;
  const auditCount = stats?.auditCount ?? 0;

  const computeCost = +(auditCount * 0.0015).toFixed(2);
  const storageCost = +(memCount * 0.008 * 1.2).toFixed(2);
  const vectorCost = +(memCount * 0.000004).toFixed(2);
  const totalCost = +(computeCost + storageCost + vectorCost).toFixed(2);
  const tier = totalCost > 500 ? "Enterprise" : totalCost > 100 ? "Pro" : "Starter";

  const usage = [
    { item: "Orchestrator runs", used: String(auditCount), cost: `$${computeCost}` },
    { item: "Memory storage", used: `${(memCount * 0.008).toFixed(2)} MB`, cost: `$${storageCost}` },
    { item: "Vector queries", used: String(memCount), cost: `$${vectorCost}` },
    { item: "Active agents", used: String(agentCount), cost: `$${(agentCount * 0).toFixed(2)}` },
  ];

  const chain = contractData?.chain;

  return (
    <DashboardLayout
      title="Wallet & Billing"
      subtitle="Real-time usage costs computed from workspace activity."
      actions={
        <Button
          data-testid="button-add-payment"
          className="h-auto rounded-xl bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] px-4 py-2 text-sm text-white hover:opacity-95"
        >
          Add payment method
        </Button>
      }
    >
      {!workspaceId && (
        <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/5 px-5 py-4 text-sm text-amber-300">
          Connect your wallet to see billing data.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="TOTAL COST" value={statsLoading ? "—" : `$${totalCost}`} delta="This workspace" testId="stat-balance" />
        <StatBlock label="COMPUTE" value={statsLoading ? "—" : `$${computeCost}`} delta={`${auditCount} runs`} testId="stat-month" />
        <StatBlock label="STORAGE" value={statsLoading ? "—" : `$${storageCost}`} delta={`${memCount} memories`} testId="stat-projected" />
        <StatBlock label="PLAN" value={tier} delta={tier === "Starter" ? "Free tier" : `${tier} features`} testId="stat-plan" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base text-white">Usage breakdown</h2>
            <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-cyan-300 hover:bg-[#ffffff08]">
              LIVE
            </Badge>
          </div>
          {statsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-lg border border-[#ffffff0d]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#ffffff05] text-[10px] tracking-[1px] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">RESOURCE</th>
                    <th className="px-4 py-3">USED</th>
                    <th className="px-4 py-3 text-right">COST</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.map((u) => (
                    <tr
                      key={u.item}
                      data-testid={`usage-row-${u.item.toLowerCase().replace(/[\s()]+/g, "-")}`}
                      className="border-t border-[#ffffff0d] text-slate-300"
                    >
                      <td className="px-4 py-3">{u.item}</td>
                      <td className="px-4 py-3 text-slate-400">{u.used}</td>
                      <td className="px-4 py-3 text-right text-white">{u.cost}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-[#ffffff14] bg-[#ffffff05]">
                    <td className="px-4 py-3 text-white">Total</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-right font-semibold text-cyan-400">${totalCost}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>

        <DashboardCard>
          <h2 className="text-base text-white">Wallet</h2>
          <div className="mt-4 space-y-3">
            <div
              data-testid="payment-method-primary"
              className="rounded-lg border border-violet-400/40 bg-[#8b5cf61a] p-4"
            >
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-violet-300" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">Connected wallet</p>
                  <p className="mt-1 truncate font-mono text-[11px] text-slate-400">
                    {address ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            {chain && (
              <div className="rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-4">
                <p className="text-sm text-white">{chain.name}</p>
                <p className="mt-1 text-xs text-slate-500">Chain ID: {chain.chainId}</p>
                {contractData?.address && (
                  <a
                    href={contractData.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                  >
                    View registry contract <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            <div className="rounded-lg border border-[#ffffff14] bg-[#ffffff05] p-4 text-xs text-slate-400">
              Usage costs are computed in real-time from workspace activity. Pricing: $0.0015/run, $1.20/GB, $0.000004/vector query.
            </div>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
