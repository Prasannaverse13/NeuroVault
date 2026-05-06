import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout, DashboardCard } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, RefreshCw, Unplug, Loader2, Plug } from "lucide-react";
import {
  SiSlack, SiNotion, SiGithub, SiLinear, SiHubspot,
  SiStripe, SiZendesk, SiOpenai, SiSalesforce, SiAirtable,
  SiPostgresql, SiSnowflake,
} from "react-icons/si";
import { api, useWorkspaceId } from "@/lib/api";
import type { Integration } from "@shared/schema";
import { useAccount } from "wagmi";

// ── Catalog ────────────────────────────────────────────────────────────────
const CATALOG = [
  { id: "slack",       name: "Slack",       category: "Communication", icon: SiSlack,      fields: [{ key: "webhook_url",       label: "Incoming Webhook URL",  placeholder: "https://hooks.slack.com/services/...", secret: false }] },
  { id: "notion",      name: "Notion",      category: "Knowledge",     icon: SiNotion,     fields: [{ key: "api_key",           label: "Integration Token",     placeholder: "secret_...",                           secret: true  }] },
  { id: "github",      name: "GitHub",      category: "DevOps",        icon: SiGithub,     fields: [{ key: "access_token",      label: "Personal Access Token", placeholder: "ghp_...",                              secret: true  }, { key: "repo", label: "Repository (optional)", placeholder: "org/repo", secret: false }] },
  { id: "linear",      name: "Linear",      category: "Project mgmt",  icon: SiLinear,     fields: [{ key: "api_key",           label: "API Key",               placeholder: "lin_api_...",                          secret: true  }] },
  { id: "hubspot",     name: "HubSpot",     category: "CRM",           icon: SiHubspot,    fields: [{ key: "api_key",           label: "Private App Token",     placeholder: "pat-na1-...",                          secret: true  }] },
  { id: "stripe",      name: "Stripe",      category: "Payments",      icon: SiStripe,     fields: [{ key: "secret_key",        label: "Secret Key",            placeholder: "sk_live_... or sk_test_...",           secret: true  }] },
  { id: "zendesk",     name: "Zendesk",     category: "Support",       icon: SiZendesk,    fields: [{ key: "subdomain",         label: "Subdomain",             placeholder: "yourcompany",                          secret: false }, { key: "api_token", label: "API Token", placeholder: "abc123...", secret: true }] },
  { id: "openai",      name: "OpenAI",      category: "Models",        icon: SiOpenai,     fields: [{ key: "api_key",           label: "API Key",               placeholder: "sk-...",                               secret: true  }] },
  { id: "salesforce",  name: "Salesforce",  category: "CRM",           icon: SiSalesforce, fields: [{ key: "instance_url",      label: "Instance URL",          placeholder: "https://yourcompany.salesforce.com",   secret: false }, { key: "access_token", label: "Access Token", placeholder: "00D...", secret: true }] },
  { id: "airtable",    name: "Airtable",    category: "Data",          icon: SiAirtable,   fields: [{ key: "api_key",           label: "Personal Access Token", placeholder: "pat...",                               secret: true  }, { key: "base_id", label: "Base ID (optional)", placeholder: "app...", secret: false }] },
  { id: "postgres",    name: "Postgres",    category: "Data",          icon: SiPostgresql, fields: [{ key: "connection_string", label: "Connection String",     placeholder: "postgresql://user:pass@host:5432/db",  secret: true  }] },
  { id: "snowflake",   name: "Snowflake",   category: "Data",          icon: SiSnowflake,  fields: [{ key: "account",           label: "Account",               placeholder: "xy12345.us-east-1",                    secret: false }, { key: "username", label: "Username", placeholder: "NEUROVAULT_USER", secret: false }, { key: "password", label: "Password", placeholder: "••••••••", secret: true }] },
] as const;

const CATEGORIES = ["All", "Communication", "Knowledge", "DevOps", "CRM", "Data", "Models", "Payments", "Support", "Project mgmt"];

// ── Types ──────────────────────────────────────────────────────────────────
type CatalogItem = typeof CATALOG[number];

export default function IntegrationsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const workspaceId = useWorkspaceId();
  const { address } = useAccount();

  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState<CatalogItem | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // ── Fetch connected integrations ──────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["/api/integrations", workspaceId],
    queryFn: () => api.listIntegrations(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 30_000,
  });

  const connected = (data?.integrations ?? []) as Integration[];
  const connectedByType = Object.fromEntries(connected.map((i) => [i.type, i]));

  // ── Connect mutation ──────────────────────────────────────────────────────
  const connectMut = useMutation({
    mutationFn: (vars: { item: CatalogItem; config: Record<string, string> }) =>
      api.connectIntegration({
        workspaceId: workspaceId!,
        type: vars.item.id,
        name: vars.item.name,
        category: vars.item.category,
        config: vars.config,
      }),
    onSuccess: (result, vars) => {
      qc.invalidateQueries({ queryKey: ["/api/integrations", workspaceId] });
      if (result.testResult?.ok) {
        toast({ title: `${vars.item.name} connected`, description: result.testResult.message });
      } else {
        toast({ title: `${vars.item.name} — connection issue`, description: result.testResult?.message, variant: "destructive" });
      }
      setModal(null);
      setFormValues({});
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ── Test mutation ─────────────────────────────────────────────────────────
  const testMut = useMutation({
    mutationFn: (id: string) => api.testIntegration(id),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["/api/integrations", workspaceId] });
      toast({
        title: result.testResult?.ok ? "Connection OK" : "Connection failed",
        description: result.testResult?.message,
        variant: result.testResult?.ok ? "default" : "destructive",
      });
    },
  });

  // ── Disconnect mutation ───────────────────────────────────────────────────
  const disconnectMut = useMutation({
    mutationFn: (id: string) => api.disconnectIntegration(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["/api/integrations", workspaceId] });
      toast({ title: "Integration disconnected" });
    },
  });

  const visible = CATALOG.filter((c) => filter === "All" || c.category === filter);
  const connectedCount = connected.filter((i) => i.status === "connected").length;

  const openModal = (item: CatalogItem) => {
    setModal(item);
    // Pre-fill if already connected (non-secret fields only)
    const existing = connectedByType[item.id];
    if (existing) {
      const prefill: Record<string, string> = {};
      item.fields.forEach((f) => {
        if (!f.secret && existing.config[f.key]) prefill[f.key] = existing.config[f.key];
      });
      setFormValues(prefill);
    } else {
      setFormValues({});
    }
  };

  const handleConnect = () => {
    if (!modal || !workspaceId) return;
    connectMut.mutate({ item: modal, config: formValues });
  };

  return (
    <DashboardLayout
      title="Integrations"
      subtitle={`${connectedCount} connected • ${CATALOG.length - connectedCount} available`}
    >
      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.filter((c) => c === "All" || CATALOG.some((i) => i.category === c)).map((c) => (
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

      {!workspaceId && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-center text-sm text-amber-300">
          Connect your wallet to manage integrations.
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((item) => {
          const Icon = item.icon;
          const integration = connectedByType[item.id as string];
          const isConnected = integration?.status === "connected";
          const hasError = integration?.status === "error";

          return (
            <DashboardCard key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#ffffff14] bg-[#ffffff08] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p data-testid={`integration-name-${item.id}`} className="text-sm text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">{item.category}</p>
                  </div>
                </div>
                {isConnected && (
                  <Badge className="border-0 bg-cyan-400/10 text-[10px] tracking-[1px] text-cyan-300 hover:bg-cyan-400/10 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> LIVE
                  </Badge>
                )}
                {hasError && (
                  <Badge className="border-0 bg-rose-400/10 text-[10px] tracking-[1px] text-rose-300 hover:bg-rose-400/10 flex items-center gap-1">
                    <XCircle className="h-2.5 w-2.5" /> ERROR
                  </Badge>
                )}
              </div>

              {integration?.statusMessage && (
                <p className={`mt-2 text-[11px] ${isConnected ? "text-cyan-400/70" : "text-rose-400/70"}`}>
                  {integration.statusMessage}
                </p>
              )}

              {integration?.testedAt && (
                <p className="mt-1 text-[10px] text-slate-600">
                  Tested {new Date(integration.testedAt).toLocaleString()}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                {isConnected || hasError ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => testMut.mutate(integration.id)}
                      disabled={testMut.isPending}
                      data-testid={`button-retest-${item.id}`}
                      className="h-auto flex-1 rounded-lg border border-[#ffffff14] bg-[#ffffff08] py-2 text-xs text-slate-300 hover:bg-[#ffffff14]"
                    >
                      {testMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RefreshCw className="mr-1 h-3 w-3" />Re-test</>}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => disconnectMut.mutate(integration.id)}
                      disabled={disconnectMut.isPending}
                      data-testid={`button-disconnect-${item.id}`}
                      className="h-auto flex-1 rounded-lg border border-[#ffffff14] bg-[#ffffff08] py-2 text-xs text-rose-300 hover:bg-[#ffffff14]"
                    >
                      {disconnectMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Unplug className="mr-1 h-3 w-3" />Disconnect</>}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={() => openModal(item)}
                    disabled={!workspaceId}
                    data-testid={`button-connect-${item.id}`}
                    className="h-auto w-full rounded-lg bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] py-2 text-xs text-white hover:opacity-95"
                  >
                    <Plug className="mr-1.5 h-3 w-3" />
                    Connect
                  </Button>
                )}
              </div>
            </DashboardCard>
          );
        })}
      </div>

      {/* Connect Modal */}
      <Dialog open={!!modal} onOpenChange={(open) => { if (!open) { setModal(null); setFormValues({}); } }}>
        <DialogContent className="border border-[#ffffff14] bg-[#0d0d14] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {modal && (() => { const Icon = modal.icon; return <Icon className="h-5 w-5" />; })()}
              Connect {modal?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your credentials below. NeuroVault stores them securely and uses them to pull live context into your agents.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {modal?.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs text-slate-400 mb-1.5">{field.label}</label>
                <input
                  type={field.secret ? "password" : "text"}
                  value={formValues[field.key] ?? ""}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  data-testid={`input-integration-${field.key}`}
                  className="w-full rounded-lg border border-[#ffffff14] bg-[#ffffff08] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-violet-400/50 focus:outline-none"
                />
              </div>
            ))}

            <div className="rounded-lg border border-[#ffffff0d] bg-[#ffffff05] p-3 text-[11px] text-slate-500">
              Credentials are encrypted at rest and never exposed to the frontend. The connection is tested live before saving.
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setModal(null); setFormValues({}); }}
                className="flex-1 border border-[#ffffff14] bg-[#ffffff08] text-slate-300 hover:bg-[#ffffff14]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConnect}
                disabled={connectMut.isPending || !workspaceId}
                data-testid="button-confirm-connect"
                className="flex-1 bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] text-white hover:opacity-95"
              >
                {connectMut.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testing…</>
                ) : (
                  "Test & Connect"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
