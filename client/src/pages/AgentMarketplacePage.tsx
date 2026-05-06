import { useState } from "react";
import { DashboardLayout, DashboardCard } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Download, Search } from "lucide-react";

const agents = [
  { name: "Atlas DevOps", author: "NeuroLabs", category: "DevOps", rating: 4.9, installs: "12.4k", price: "Free", desc: "Production infrastructure agent with deep observability memory." },
  { name: "Echo Support", author: "VaultAI", category: "Support", rating: 4.8, installs: "9.1k", price: "$29/mo", desc: "Empathetic customer support with full conversation history." },
  { name: "Pulse Analytics", author: "Synth", category: "Analytics", rating: 4.7, installs: "6.8k", price: "$49/mo", desc: "Real-time analytics narrator with anomaly detection." },
  { name: "Vault Knowledge", author: "NeuroLabs", category: "Knowledge", rating: 4.9, installs: "15.2k", price: "Free", desc: "Fragmented docs → unified, queryable knowledge core." },
  { name: "Compliance Bot", author: "TrustOS", category: "Security", rating: 4.6, installs: "3.2k", price: "$99/mo", desc: "SOC2 / HIPAA / GDPR aware policy enforcement agent." },
  { name: "Forge Coder", author: "DevForge", category: "DevOps", rating: 4.8, installs: "8.7k", price: "$39/mo", desc: "Multi-repo code agent with refactor + review memory." },
  { name: "Lumen Research", author: "Helix", category: "Knowledge", rating: 4.5, installs: "4.4k", price: "$19/mo", desc: "Synthesizes papers, news, and internal docs into briefs." },
  { name: "Sage Sales", author: "Closer", category: "Sales", rating: 4.4, installs: "5.6k", price: "$59/mo", desc: "Conversational sales agent with CRM-grade memory." },
];

const filters = ["All", "DevOps", "Support", "Analytics", "Knowledge", "Security", "Sales"];

export default function AgentMarketplacePage() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const visible = agents.filter((a) => {
    const f = filter === "All" || a.category === filter;
    const q = a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.desc.toLowerCase().includes(query.toLowerCase());
    return f && q;
  });

  return (
    <DashboardLayout
      title="Agent marketplace"
      subtitle="Discover and deploy specialized intelligence modules from the community."
    >
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
          {filters.map((f) => (
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((a) => (
          <DashboardCard key={a.name}>
            <div className="flex items-start justify-between">
              <div>
                <p
                  data-testid={`agent-card-${a.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-base text-white"
                >
                  {a.name}
                </p>
                <p className="text-xs text-slate-500">by {a.author}</p>
              </div>
              <Badge className="border border-[#ffffff14] bg-[#ffffff08] text-[10px] tracking-[1px] text-violet-300 hover:bg-[#ffffff08]">
                {a.category.toUpperCase()}
              </Badge>
            </div>
            <p className="mt-3 line-clamp-2 text-xs text-slate-400">{a.desc}</p>
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1 text-amber-300">
                <Star className="h-3 w-3 fill-current" /> {a.rating}
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" /> {a.installs}
              </span>
              <span className="ml-auto text-cyan-400">{a.price}</span>
            </div>
            <Button
              type="button"
              data-testid={`button-install-${a.name.toLowerCase().replace(/\s+/g, "-")}`}
              className="mt-4 h-auto w-full rounded-lg bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] py-2 text-xs text-white hover:opacity-95"
            >
              Install agent
            </Button>
          </DashboardCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
