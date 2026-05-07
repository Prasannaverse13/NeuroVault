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
import { CheckCircle2, XCircle, RefreshCw, Unplug, Loader2, Plug, Lock } from "lucide-react";
import {
  SiSlack, SiNotion, SiGithub, SiLinear, SiHubspot,
  SiStripe, SiZendesk, SiOpenai, SiSalesforce, SiAirtable,
  SiPostgresql, SiSnowflake,
} from "react-icons/si";
import { api, useWorkspaceId } from "@/lib/api";
import type { Integration } from "@shared/schema";
import { useAccount } from "wagmi";

// ── Catalog ────────────────────────────────────────────────────────────────
// live = true → fully supported; live = false → coming soon
const CATALOG = [
  {
    id: "github", name: "GitHub", category: "DevOps", icon: SiGithub, live: true,
    fields: [
      { key: "access_token", label: "Personal Access Token", placeholder: "ghp_... or github_pat_...", secret: true },
      { key: "repo",         label: "Repository (optional)", placeholder: "org/repo",                  secret: false },
    ],
  },
  { id: "slack",      name: "Slack",      category: "Communication", icon: SiSlack,      live: false, fields: [] },
  { id: "notion",     name: "Notion",     category: "Knowledge",     icon: SiNotion,     live: false, fields: [] },
  { id: "linear",     name: "Linear",     category: "Project mgmt",  icon: SiLinear,     live: false, fields: [] },
  { id: "hubspot",    name: "HubSpot",    category: "CRM",           icon: SiHubspot,    live: false, fields: [] },
  { id: "stripe",     name: "Stripe",     category: "Payments",      icon: SiStripe,     live: false, fields: [] },
  { id: "zendesk",    name: "Zendesk",    category: "Support",       icon: SiZendesk,    live: false, fields: [] },
  { id: "openai",     name: "OpenAI",     category: "Models",        icon: SiOpenai,     live: false, fields: [] },
  { id: "salesforce", name: "Salesforce", category: "CRM",           icon: SiSalesforce, live: false, fields: [] },
  { id: "airtable",   name: "Airtable",   category: "Data",          icon: SiAirtable,   live: false, fields: [] },
  { id: "postgres",   name: "Postgres",   category: "Data",          icon: SiPostgresql, live: false, fields: [] },
  { id: "snowflake",  name: "Snowflake",  category: "Data",          icon: SiSnowflake,  live: false, fields: [] },
] as const;

type CatalogItem = typeof CATALOG[number];
type LiveCatalogItem = Extract<typeof CATALOG[number], { live: true }>;

export default function IntegrationsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const workspaceId = useWorkspaceId();
  const { address } = useAccount();

  const [modal, setModal] = useState<LiveCatalogItem | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["/api/integrations", workspaceId],
    queryFn: () => api.listIntegrations(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 30_000,
  });

  const connected = (data?.integrations ?? []) as Integration[];
  const connectedByType = Object.fromEntries(connected.map((i) => [i.type, i]));
  const connectedCount = connected.filter((i) => i.status === "connected").length;

  // ── Connect ───────────────────────────────────────────────────────────────
  const connectMut = useMutation({
    mutationFn: (vars: { item: LiveCatalogItem; config: Record<string, string> }) =>
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
        toast({
          title: `${vars.item.name} — connection issue`,
          description: result.testResult?.message,
          variant: "destructive",
        });
      }
      setModal(null);
      setFormValues({});
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ── Re-test ───────────────────────────────────────────────────────────────
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

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnectMut = useMutation({
    mutationFn: (id: string) => api.disconnectIntegration(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/integrations", workspaceId] });
      toast({ title: "Integration disconnected" });
    },
  });

  const openModal = (item: LiveCatalogItem) => {
    setModal(item);
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

  return (
    <DashboardLayout
      title="Integrations"
      subtitle={`${connectedCount} connected • ${CATALOG.length} available`}
    >
      {!workspaceId && (
        <div className="mb-6 rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-center text-sm text-amber-300">
          Connect your wallet to manage integrations.
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATALOG.map((item) => {
          const Icon = item.icon;
          const integration = connectedByType[item.id as string];
          const isConnected = integration?.status === "connected";
          const hasError = integration?.status === "error";

          if (!item.live) {
            return (
              <DashboardCard key={item.id} className="opacity-60">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#ffffff14] bg-[#ffffff08] text-slate-500">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">{item.name}</p>
                      <p className="text-xs text-slate-600">{item.category}</p>
                    </div>
                  </div>
                  <Badge className="border-0 bg-[#ffffff08] text-[10px] tracking-[1px] text-slate-500 hover:bg-[#ffffff08] flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> SOON
                  </Badge>
                </div>
                <div className="mt-4">
                  <div
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#ffffff0d] bg-[#ffffff05] py-2 text-xs text-slate-600 cursor-not-allowed select-none"
                  >
                    <Lock className="h-3 w-3" /> Coming soon
                  </div>
                </div>
              </DashboardCard>
            );
          }

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
                      {testMut.isPending
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <><RefreshCw className="mr-1 h-3 w-3" />Re-test</>}
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
                      {disconnectMut.isPending
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <><Unplug className="mr-1 h-3 w-3" />Disconnect</>}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={() => openModal(item as LiveCatalogItem)}
                    disabled={!workspaceId}
                    data-testid={`button-connect-${item.id}`}
                    className="h-auto w-full rounded-lg bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] py-2 text-xs text-white hover:opacity-95 disabled:opacity-40"
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

            {modal?.id === "github" && (
              <div className="rounded-lg border border-violet-400/10 bg-violet-400/5 p-3 text-[11px] text-slate-400 leading-relaxed">
                Generate a token at{" "}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-300 underline hover:text-violet-200"
                >
                  github.com/settings/tokens
                </a>
                . Classic PAT: needs <span className="font-mono text-slate-300">repo</span> scope.
                Fine-grained PAT: needs repository read access.
              </div>
            )}

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
                onClick={() => {
                  if (!modal || !workspaceId) return;
                  connectMut.mutate({ item: modal, config: formValues });
                }}
                disabled={connectMut.isPending || !workspaceId}
                data-testid="button-confirm-connect"
                className="flex-1 bg-[linear-gradient(90deg,rgba(34,211,238,1)_0%,rgba(139,92,246,1)_100%)] text-white hover:opacity-95"
              >
                {connectMut.isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Testing…</>
                  : "Test & Connect"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
