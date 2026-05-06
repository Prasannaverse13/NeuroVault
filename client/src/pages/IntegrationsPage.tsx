import { useState } from "react";
import { DashboardLayout, DashboardCard } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SiSlack,
  SiNotion,
  SiGithub,
  SiLinear,
  SiHubspot,
  SiStripe,
  SiZendesk,
  SiOpenai,
  SiSalesforce,
  SiAirtable,
  SiPostgresql,
  SiSnowflake,
} from "react-icons/si";

const initial = [
  { id: "slack", name: "Slack", category: "Communication", icon: SiSlack, connected: true },
  { id: "notion", name: "Notion", category: "Knowledge", icon: SiNotion, connected: true },
  { id: "github", name: "GitHub", category: "DevOps", icon: SiGithub, connected: true },
  { id: "linear", name: "Linear", category: "Project mgmt", icon: SiLinear, connected: false },
  { id: "hubspot", name: "HubSpot", category: "CRM", icon: SiHubspot, connected: false },
  { id: "stripe", name: "Stripe", category: "Payments", icon: SiStripe, connected: true },
  { id: "zendesk", name: "Zendesk", category: "Support", icon: SiZendesk, connected: false },
  { id: "openai", name: "OpenAI", category: "Models", icon: SiOpenai, connected: true },
  { id: "salesforce", name: "Salesforce", category: "CRM", icon: SiSalesforce, connected: false },
  { id: "airtable", name: "Airtable", category: "Data", icon: SiAirtable, connected: false },
  { id: "postgres", name: "Postgres", category: "Data", icon: SiPostgresql, connected: true },
  { id: "snowflake", name: "Snowflake", category: "Data", icon: SiSnowflake, connected: false },
];

const categories = ["All", "Communication", "Knowledge", "DevOps", "CRM", "Data", "Models"];

export default function IntegrationsPage() {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState("All");

  const toggle = (id: string) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, connected: !i.connected } : i)),
    );

  const visible = filter === "All" ? items : items.filter((i) => i.category === filter);
  const connectedCount = items.filter((i) => i.connected).length;

  return (
    <DashboardLayout
      title="Integrations"
      subtitle={`${connectedCount} connected • ${items.length - connectedCount} available`}
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            data-testid={`filter-${c.toLowerCase().replace(/\s+/g, "-")}`}
            className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
              filter === c
                ? "bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] text-white"
                : "border border-[#ffffff14] bg-[#ffffff08] text-slate-400 hover:text-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((it) => {
          const Icon = it.icon;
          return (
            <DashboardCard key={it.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#ffffff14] bg-[#ffffff08] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p
                      data-testid={`integration-name-${it.id}`}
                      className="text-sm text-white"
                    >
                      {it.name}
                    </p>
                    <p className="text-xs text-slate-500">{it.category}</p>
                  </div>
                </div>
                {it.connected && (
                  <Badge className="border-0 bg-cyan-400/10 text-[10px] tracking-[1px] text-cyan-300 hover:bg-cyan-400/10">
                    LIVE
                  </Badge>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggle(it.id)}
                data-testid={`button-toggle-${it.id}`}
                className={`mt-4 h-auto w-full rounded-lg py-2 text-xs ${
                  it.connected
                    ? "border border-[#ffffff14] bg-[#ffffff08] text-rose-300 hover:bg-[#ffffff14]"
                    : "bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] text-white hover:opacity-95"
                }`}
              >
                {it.connected ? "Disconnect" : "Connect"}
              </Button>
            </DashboardCard>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
