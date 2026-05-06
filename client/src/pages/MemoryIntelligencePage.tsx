import { useState } from "react";
import { DashboardLayout, DashboardCard, StatBlock } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Search, Trash2 } from "lucide-react";

const clusters = [
  { id: "vault-prod", region: "us-east-1", size: "84.2 GB", vectors: "12.4M", health: "Optimal" },
  { id: "vault-eu", region: "eu-west-2", size: "61.7 GB", vectors: "8.9M", health: "Optimal" },
  { id: "vault-apac", region: "ap-south-1", size: "40.5 GB", vectors: "6.1M", health: "Rebalancing" },
];

const memories = [
  { snippet: "Customer Acme Inc. uses Postgres 15, sharded by region.", agent: "Echo Support", recall: 94, age: "4d" },
  { snippet: "Deployment playbook for hotfix releases requires staging gate.", agent: "Atlas DevOps", recall: 89, age: "2d" },
  { snippet: "Q3 OKR: ship marketplace v2, reduce TTI to <200ms.", agent: "Vault Knowledge", recall: 81, age: "11d" },
  { snippet: "Privacy policy section 4.2 governs PII retention windows.", agent: "Compliance Bot", recall: 76, age: "18h" },
  { snippet: "Pricing experiment B converts 14% better than control.", agent: "Pulse Analytics", recall: 72, age: "6d" },
];

export default function MemoryIntelligencePage() {
  const [query, setQuery] = useState("");
  const filtered = memories.filter((m) =>
    m.snippet.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <DashboardLayout
      title="Memory intelligence"
      subtitle="Inspect, search, and manage long-term memories across all clusters."
      actions={
        <Button
          data-testid="button-rebalance"
          className="h-auto rounded-xl border border-[#ffffff14] bg-[#ffffff08] px-4 py-2 text-sm text-white hover:bg-[#ffffff14]"
          variant="ghost"
        >
          Rebalance
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock label="TOTAL VECTORS" value="27.4M" delta="↑ 2.1M this week" testId="stat-vectors" />
        <StatBlock label="STORAGE USED" value="186.4 GB" delta="62% of 300 GB" testId="stat-storage" />
        <StatBlock label="P95 RECALL" value="48 ms" delta="↓ 6 ms" testId="stat-recall" />
        <StatBlock label="EVICTIONS (24H)" value="1,204" delta="Stable" testId="stat-evictions" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base text-white">Memory search</h2>
            <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-violet-300 hover:bg-[#ffffff08]">
              SEMANTIC
            </Badge>
          </div>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across all memories…"
              data-testid="input-memory-search"
              className="w-full rounded-lg border border-[#ffffff14] bg-[#ffffff08] py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
            />
          </div>
          <div className="mt-4 space-y-2">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                No memories match "{query}".
              </p>
            )}
            {filtered.map((m, i) => (
              <div
                key={i}
                data-testid={`memory-row-${i}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">{m.snippet}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {m.agent} • {m.age} ago
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-cyan-400">{m.recall}%</span>
                  <button
                    type="button"
                    data-testid={`button-evict-${i}`}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard>
          <h2 className="text-base text-white">Clusters</h2>
          <div className="mt-4 space-y-3">
            {clusters.map((c) => (
              <div
                key={c.id}
                data-testid={`cluster-${c.id}`}
                className="rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-violet-400" />
                    <span className="text-sm text-white">{c.id}</span>
                  </div>
                  <Badge
                    className={`border-0 text-[10px] tracking-[1px] hover:bg-transparent ${
                      c.health === "Optimal"
                        ? "bg-cyan-400/10 text-cyan-300"
                        : "bg-amber-400/10 text-amber-300"
                    }`}
                  >
                    {c.health.toUpperCase()}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-400">
                  <div>
                    <p className="text-slate-500">Region</p>
                    <p className="text-slate-200">{c.region}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Size</p>
                    <p className="text-slate-200">{c.size}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Vectors</p>
                    <p className="text-slate-200">{c.vectors}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
